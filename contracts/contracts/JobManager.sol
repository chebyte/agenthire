// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "./AgentRegistry.sol";
import "./interfaces/IERC8183.sol";

contract JobManager is IERC8183, ERC165 {
    using SafeERC20 for IERC20;

    enum JobStatus { Open, ProviderSelected, Funded, Submitted, Approved, Rejected, Cancelled }

    struct Job {
        address client;
        address provider;
        address evaluator;
        string metadataUri;
        string deliverableUri;
        uint256 budget;
        address token;
        uint256 reputationThreshold;
        uint256 selectedBidId;
        uint256 selectedAgentId;
        uint256 fundedAt;
        uint256 submittedAt;
        uint256 resolvedAt;
        JobStatus status;
    }

    struct Bid {
        uint256 agentId;
        address bidder;
        uint256 amount;
        string metadataUri;
        bool selected;
        bool exists;
    }

    error ReputationBelowThreshold(uint256 agentId, uint256 score, uint256 threshold);

    // EIP-712 typed data
    bytes32 public constant BID_TYPEHASH = keccak256(
        "Bid(uint256 jobId,uint256 agentId,uint256 amount,string metadataUri,uint256 nonce,uint256 deadline)"
    );

    mapping(address => uint256) public signerNonces;

    AgentRegistry public registry;
    address public owner;
    uint256 public nextJobId = 1;

    mapping(uint256 => Job) public jobs;
    mapping(uint256 => mapping(uint256 => Bid)) public bids;
    mapping(uint256 => uint256) public bidCount;
    mapping(uint256 => uint256) public jobExpiration;
    mapping(uint256 => address) public jobHooks;

    event JobCreated(uint256 indexed jobId, address indexed client, uint256 budget, uint256 threshold);
    event JobCancelled(uint256 indexed jobId);
    event BidPlaced(uint256 indexed jobId, uint256 indexed bidId, uint256 agentId, uint256 amount);
    event ProviderSelected(uint256 indexed jobId, uint256 bidId, uint256 agentId);
    event JobFunded(uint256 indexed jobId, uint256 amount);
    event DeliverableSubmitted(uint256 indexed jobId, string deliverableUri);
    event DeliverableApproved(uint256 indexed jobId);
    event DeliverableRejected(uint256 indexed jobId);
    event PaymentReleased(uint256 indexed jobId, address provider, uint256 amount);
    event PaymentRefunded(uint256 indexed jobId, address client, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    function setRegistry(address _registry) external {
        require(msg.sender == owner, "Not owner");
        require(address(registry) == address(0), "Registry already set");
        registry = AgentRegistry(_registry);
    }

    function createJob(
        string calldata metadataUri,
        uint256 budget,
        address token,
        uint256 reputationThreshold,
        address evaluator
    ) external returns (uint256) {
        uint256 jobId = nextJobId++;
        jobs[jobId] = Job({
            client: msg.sender,
            provider: address(0),
            evaluator: evaluator,
            metadataUri: metadataUri,
            deliverableUri: "",
            budget: budget,
            token: token,
            reputationThreshold: reputationThreshold,
            selectedBidId: 0,
            selectedAgentId: 0,
            fundedAt: 0,
            submittedAt: 0,
            resolvedAt: 0,
            status: JobStatus.Open
        });
        emit JobCreated(jobId, msg.sender, budget, reputationThreshold);
        return jobId;
    }

    function placeBid(
        uint256 jobId,
        uint256 agentId,
        uint256 amount,
        string calldata metadataUri
    ) external returns (uint256) {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Open, "Job not open");
        require(amount <= job.budget, "Bid exceeds budget");

        AgentRegistry.Agent memory agent = registry.getAgent(agentId);
        require(agent.owner == msg.sender, "Not agent owner");
        require(agent.active, "Agent not active");

        if (agent.reputationScore < job.reputationThreshold) {
            revert ReputationBelowThreshold(agentId, agent.reputationScore, job.reputationThreshold);
        }

        uint256 bidId = ++bidCount[jobId];
        bids[jobId][bidId] = Bid({
            agentId: agentId,
            bidder: msg.sender,
            amount: amount,
            metadataUri: metadataUri,
            selected: false,
            exists: true
        });

        emit BidPlaced(jobId, bidId, agentId, amount);
        return bidId;
    }

    function cancelJob(uint256 jobId) external {
        Job storage job = jobs[jobId];
        require(job.client == msg.sender, "Not client");
        require(
            job.status == JobStatus.Open || job.status == JobStatus.ProviderSelected,
            "Cannot cancel after funding"
        );
        job.status = JobStatus.Cancelled;
        emit JobCancelled(jobId);
    }

    function selectProvider(uint256 jobId, uint256 bidId) external {
        Job storage job = jobs[jobId];
        require(job.client == msg.sender, "Not client");
        require(job.status == JobStatus.Open, "Job not open");

        Bid storage bid = bids[jobId][bidId];
        require(bid.exists, "Bid does not exist");

        bid.selected = true;
        job.selectedBidId = bidId;
        job.selectedAgentId = bid.agentId;
        job.provider = bid.bidder;
        job.status = JobStatus.ProviderSelected;

        emit ProviderSelected(jobId, bidId, bid.agentId);
    }

    function fundJob(uint256 jobId) external {
        Job storage job = jobs[jobId];
        require(job.client == msg.sender, "Not client");
        require(job.status == JobStatus.ProviderSelected, "Provider not selected");

        Bid storage selectedBid = bids[jobId][job.selectedBidId];
        uint256 escrowAmount = selectedBid.amount;

        IERC20(job.token).safeTransferFrom(msg.sender, address(this), escrowAmount);
        job.fundedAt = block.timestamp;
        job.status = JobStatus.Funded;

        emit JobFunded(jobId, escrowAmount);
    }

    function submitDeliverable(uint256 jobId, string calldata deliverableUri) external {
        Job storage job = jobs[jobId];
        require(job.provider == msg.sender, "Not provider");
        require(job.status == JobStatus.Funded, "Job not funded");

        job.deliverableUri = deliverableUri;
        job.submittedAt = block.timestamp;
        job.status = JobStatus.Submitted;

        emit DeliverableSubmitted(jobId, deliverableUri);
    }

    function approveDeliverable(uint256 jobId) external {
        Job storage job = jobs[jobId];
        require(job.evaluator == msg.sender, "Not evaluator");
        require(job.status == JobStatus.Submitted, "Not submitted");

        Bid storage selectedBid = bids[jobId][job.selectedBidId];
        uint256 amount = selectedBid.amount;

        // CEI: update state before external calls
        job.resolvedAt = block.timestamp;
        job.status = JobStatus.Approved;

        IERC20(job.token).safeTransfer(job.provider, amount);
        registry.updateReputation(job.selectedAgentId, 10, jobId);

        emit DeliverableApproved(jobId);
        emit PaymentReleased(jobId, job.provider, amount);
    }

    function rejectDeliverable(uint256 jobId) external {
        Job storage job = jobs[jobId];
        require(job.evaluator == msg.sender, "Not evaluator");
        require(job.status == JobStatus.Submitted, "Not submitted");

        Bid storage selectedBid = bids[jobId][job.selectedBidId];
        uint256 amount = selectedBid.amount;

        // CEI: update state before external calls
        job.resolvedAt = block.timestamp;
        job.status = JobStatus.Rejected;

        IERC20(job.token).safeTransfer(job.client, amount);
        registry.updateReputation(job.selectedAgentId, -15, jobId);

        emit DeliverableRejected(jobId);
        emit PaymentRefunded(jobId, job.client, amount);
    }

    function getJob(uint256 jobId) external view returns (Job memory) {
        return jobs[jobId];
    }

    function getBid(uint256 jobId, uint256 bidId) external view returns (Bid memory) {
        return bids[jobId][bidId];
    }

    function getJobBidCount(uint256 jobId) external view returns (uint256) {
        return bidCount[jobId];
    }

    // --- EIP-712 Signed Bids ---

    function _domainSeparator() internal view returns (bytes32) {
        return keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("AgentHire"),
                keccak256("1"),
                block.chainid,
                address(this)
            )
        );
    }

    function placeBidWithSignature(
        uint256 jobId,
        uint256 agentId,
        uint256 amount,
        string calldata metadataUri,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external returns (uint256) {
        require(block.timestamp <= deadline, "Bid expired");

        // Recover signer from EIP-712 signature
        AgentRegistry.Agent memory agent = registry.getAgent(agentId);
        address signerAddr = agent.owner;
        uint256 nonce = signerNonces[signerAddr];

        bytes32 structHash = keccak256(
            abi.encode(
                BID_TYPEHASH,
                jobId,
                agentId,
                amount,
                keccak256(bytes(metadataUri)),
                nonce,
                deadline
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", _domainSeparator(), structHash)
        );

        address recovered = ecrecover(digest, v, r, s);
        require(recovered != address(0), "Invalid signature");
        require(recovered == signerAddr, "Signer is not agent owner");

        // Consume nonce
        signerNonces[signerAddr] = nonce + 1;

        // Same validations as placeBid
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Open, "Job not open");
        require(amount <= job.budget, "Bid exceeds budget");
        require(agent.active, "Agent not active");

        if (agent.reputationScore < job.reputationThreshold) {
            revert ReputationBelowThreshold(agentId, agent.reputationScore, job.reputationThreshold);
        }

        uint256 bidId = ++bidCount[jobId];
        bids[jobId][bidId] = Bid({
            agentId: agentId,
            bidder: signerAddr,
            amount: amount,
            metadataUri: metadataUri,
            selected: false,
            exists: true
        });

        emit BidPlaced(jobId, bidId, agentId, amount);
        return bidId;
    }

    function placeBidWithSignatureAndSelect(
        uint256 jobId,
        uint256 agentId,
        uint256 amount,
        string calldata metadataUri,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external returns (uint256) {
        require(block.timestamp <= deadline, "Bid expired");

        // Verify caller is job client (needed for selection)
        Job storage job = jobs[jobId];
        require(job.client == msg.sender, "Not client");
        require(job.status == JobStatus.Open, "Job not open");

        // Recover signer from EIP-712 signature
        AgentRegistry.Agent memory agent = registry.getAgent(agentId);
        address signerAddr = agent.owner;
        uint256 nonce = signerNonces[signerAddr];

        bytes32 structHash = keccak256(
            abi.encode(
                BID_TYPEHASH,
                jobId,
                agentId,
                amount,
                keccak256(bytes(metadataUri)),
                nonce,
                deadline
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", _domainSeparator(), structHash)
        );

        address recovered = ecrecover(digest, v, r, s);
        require(recovered != address(0), "Invalid signature");
        require(recovered == signerAddr, "Signer is not agent owner");

        // Consume nonce
        signerNonces[signerAddr] = nonce + 1;

        // Validate bid
        require(amount <= job.budget, "Bid exceeds budget");
        require(agent.active, "Agent not active");

        if (agent.reputationScore < job.reputationThreshold) {
            revert ReputationBelowThreshold(agentId, agent.reputationScore, job.reputationThreshold);
        }

        // Place bid
        uint256 bidId = ++bidCount[jobId];
        bids[jobId][bidId] = Bid({
            agentId: agentId,
            bidder: signerAddr,
            amount: amount,
            metadataUri: metadataUri,
            selected: true,
            exists: true
        });

        emit BidPlaced(jobId, bidId, agentId, amount);

        // Select provider
        job.selectedBidId = bidId;
        job.selectedAgentId = agentId;
        job.provider = signerAddr;
        job.status = JobStatus.ProviderSelected;

        emit ProviderSelected(jobId, bidId, agentId);

        return bidId;
    }

    function getNonce(address account) external view returns (uint256) {
        return signerNonces[account];
    }

    // --- ERC-8183 Interface Implementation ---

    /// @notice ERC-8183 createJob: creates a job with provider, evaluator, expiration, description, and hook
    function createJob(
        address provider,
        address evaluator,
        uint256 expiredAt,
        string calldata description,
        address hook
    ) external returns (uint256) {
        uint256 jobId = nextJobId++;
        jobs[jobId] = Job({
            client: msg.sender,
            provider: provider,
            evaluator: evaluator,
            metadataUri: description,
            deliverableUri: "",
            budget: 0,
            token: address(0),
            reputationThreshold: 0,
            selectedBidId: 0,
            selectedAgentId: 0,
            fundedAt: 0,
            submittedAt: 0,
            resolvedAt: 0,
            status: JobStatus.Open
        });
        jobExpiration[jobId] = expiredAt;
        jobHooks[jobId] = hook;
        emit JobCreated(jobId, msg.sender, 0, 0);
        return jobId;
    }

    /// @notice ERC-8183 setProvider: sets provider on an Open job (no state change per spec)
    function setProvider(uint256 jobId, address provider, bytes calldata /*optParams*/) external {
        Job storage job = jobs[jobId];
        require(job.client == msg.sender, "Not client");
        require(job.status == JobStatus.Open, "Job not open");
        job.provider = provider;
        emit ProviderSelected(jobId, 0, 0);
    }

    /// @notice ERC-8183 setBudget: sets budget and token for a job (Open or ProviderSelected)
    function setBudget(uint256 jobId, uint256 amount, bytes calldata optParams) external {
        Job storage job = jobs[jobId];
        require(job.client == msg.sender, "Not client");
        require(
            job.status == JobStatus.Open || job.status == JobStatus.ProviderSelected,
            "Cannot set budget after funding"
        );
        job.budget = amount;
        if (optParams.length >= 32) {
            job.token = abi.decode(optParams, (address));
        }
    }

    /// @notice ERC-8183 fund: funds a job (Open with provider set, or ProviderSelected from marketplace path)
    function fund(uint256 jobId, uint256 expectedBudget, bytes calldata /*optParams*/) external {
        Job storage job = jobs[jobId];
        require(job.client == msg.sender, "Not client");
        require(
            job.status == JobStatus.Open || job.status == JobStatus.ProviderSelected,
            "Cannot fund in current state"
        );
        require(job.provider != address(0), "Provider not set");
        require(job.budget > 0, "Budget not set");
        require(job.budget == expectedBudget, "Budget mismatch");
        require(job.token != address(0), "Token not set");

        IERC20(job.token).safeTransferFrom(msg.sender, address(this), job.budget);
        job.fundedAt = block.timestamp;
        job.status = JobStatus.Funded;
        emit JobFunded(jobId, job.budget);
    }

    /// @notice ERC-8183 submit: provider submits deliverable hash
    function submit(uint256 jobId, bytes32 deliverable, bytes calldata optParams) external {
        Job storage job = jobs[jobId];
        require(job.provider == msg.sender, "Not provider");
        require(job.status == JobStatus.Funded, "Job not funded");

        // Use optParams as deliverable URI if provided, else use bytes32 hex
        string memory uri;
        if (optParams.length > 0) {
            uri = abi.decode(optParams, (string));
        } else {
            uri = _bytes32ToHexString(deliverable);
        }
        job.deliverableUri = uri;
        job.submittedAt = block.timestamp;
        job.status = JobStatus.Submitted;
        emit DeliverableSubmitted(jobId, uri);
    }

    /// @notice ERC-8183 complete: evaluator approves the job
    function complete(uint256 jobId, bytes32 /*reason*/, bytes calldata /*optParams*/) external {
        Job storage job = jobs[jobId];
        require(job.evaluator == msg.sender, "Not evaluator");
        require(job.status == JobStatus.Submitted, "Not submitted");

        uint256 amount = job.budget;
        if (job.selectedBidId != 0) {
            amount = bids[jobId][job.selectedBidId].amount;
        }

        // CEI: update state before external calls
        job.resolvedAt = block.timestamp;
        job.status = JobStatus.Approved;

        IERC20(job.token).safeTransfer(job.provider, amount);

        if (job.selectedAgentId != 0) {
            registry.updateReputation(job.selectedAgentId, 10, jobId);
        }

        emit DeliverableApproved(jobId);
        emit PaymentReleased(jobId, job.provider, amount);
    }

    /// @notice ERC-8183 reject: client rejects Open jobs, evaluator rejects Funded/Submitted jobs
    function reject(uint256 jobId, bytes32 /*reason*/, bytes calldata /*optParams*/) external {
        Job storage job = jobs[jobId];

        if (job.status == JobStatus.Open) {
            // Client can reject an Open job (cancel before funding)
            require(job.client == msg.sender, "Not client");
            job.resolvedAt = block.timestamp;
            job.status = JobStatus.Rejected;
            emit DeliverableRejected(jobId);
        } else if (job.status == JobStatus.Funded || job.status == JobStatus.Submitted) {
            // Evaluator rejects funded/submitted jobs — refund client
            require(job.evaluator == msg.sender, "Not evaluator");

            uint256 amount = job.budget;
            if (job.selectedBidId != 0) {
                amount = bids[jobId][job.selectedBidId].amount;
            }

            // CEI: update state before external calls
            job.resolvedAt = block.timestamp;
            job.status = JobStatus.Rejected;

            IERC20(job.token).safeTransfer(job.client, amount);

            if (job.selectedAgentId != 0) {
                registry.updateReputation(job.selectedAgentId, -15, jobId);
            }

            emit DeliverableRejected(jobId);
            emit PaymentRefunded(jobId, job.client, amount);
        } else {
            revert("Cannot reject in current state");
        }
    }

    /// @notice ERC-8183 claimRefund: permissionless refund for expired jobs (deliberately not hookable)
    function claimRefund(uint256 jobId) external {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Funded || job.status == JobStatus.Submitted, "Not refundable");
        require(jobExpiration[jobId] > 0, "No expiration set");
        require(block.timestamp >= jobExpiration[jobId], "Job not expired");

        uint256 amount = job.budget;
        if (job.selectedBidId != 0) {
            amount = bids[jobId][job.selectedBidId].amount;
        }

        // CEI: update state before external calls
        job.resolvedAt = block.timestamp;
        job.status = JobStatus.Cancelled;

        IERC20(job.token).safeTransfer(job.client, amount);
        emit PaymentRefunded(jobId, job.client, amount);
    }

    /// @notice ERC165 supportsInterface
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IERC8183).interfaceId || super.supportsInterface(interfaceId);
    }

    /// @dev Convert bytes32 to hex string for deliverable URI fallback
    function _bytes32ToHexString(bytes32 data) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(66); // "0x" + 64 hex chars
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 32; i++) {
            str[2 + i * 2] = alphabet[uint8(data[i] >> 4)];
            str[3 + i * 2] = alphabet[uint8(data[i] & 0x0f)];
        }
        return string(str);
    }
}

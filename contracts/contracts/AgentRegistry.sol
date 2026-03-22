// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IERC8004.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

contract AgentRegistry is IERC8004, ERC165 {
    struct Agent {
        address owner;
        string metadataUri;
        uint256 reputationScore;
        bool active;
    }

    address public immutable jobManager;
    address public immutable deployer;
    uint256 public nextAgentId = 1;
    mapping(uint256 => Agent) public agents;
    mapping(uint256 => mapping(string => bytes)) private _metadata;

    // AgentRegistered event inherited from IERC8004
    event AgentDeactivated(uint256 indexed agentId);
    event AgentReactivated(uint256 indexed agentId);
    event ReputationUpdated(uint256 indexed agentId, uint256 oldScore, uint256 newScore, int256 delta, uint256 jobId);
    event MetadataUpdated(uint256 indexed agentId, string newUri);
    event MetadataSet(uint256 indexed agentId, string metadataKey, bytes metadataValue);

    constructor(address _jobManager) {
        jobManager = _jobManager;
        deployer = msg.sender;
    }

    function registerAgent(string calldata metadataUri) external returns (uint256) {
        return _createAgent(metadataUri);
    }

    function updateMetadataUri(uint256 agentId, string calldata newUri) external {
        require(agents[agentId].owner == msg.sender, "Not agent owner");
        agents[agentId].metadataUri = newUri;
        emit MetadataUpdated(agentId, newUri);
    }

    function updateReputation(uint256 agentId, int256 delta, uint256 jobId) external {
        require(msg.sender == jobManager, "Not authorized");
        Agent storage agent = agents[agentId];
        uint256 oldScore = agent.reputationScore;
        int256 newScore = int256(oldScore) + delta;
        if (newScore < 0) newScore = 0;
        if (newScore > 100) newScore = 100;
        agent.reputationScore = uint256(newScore);
        emit ReputationUpdated(agentId, oldScore, uint256(newScore), delta, jobId);
    }

    function deactivateAgent(uint256 agentId) external {
        require(agents[agentId].owner == msg.sender, "Not agent owner");
        agents[agentId].active = false;
        emit AgentDeactivated(agentId);
    }

    function reactivateAgent(uint256 agentId) external {
        require(agents[agentId].owner == msg.sender, "Not agent owner");
        agents[agentId].active = true;
        emit AgentReactivated(agentId);
    }

    function setReputationForTesting(uint256 agentId, uint256 score) external {
        require(msg.sender == deployer, "Not deployer");
        require(score <= 100, "Score exceeds max");
        uint256 oldScore = agents[agentId].reputationScore;
        agents[agentId].reputationScore = score;
        emit ReputationUpdated(agentId, oldScore, score, int256(score) - int256(oldScore), 0);
    }

    function getAgent(uint256 agentId) external view returns (Agent memory) {
        return agents[agentId];
    }

    // --- ERC-8004 Interface Implementation ---

    /// @notice ERC-8004 register: delegates to internal _createAgent
    function register(string calldata agentURI) external returns (uint256) {
        return _createAgent(agentURI);
    }

    /// @notice ERC-8004 setAgentURI: delegates to updateMetadataUri logic
    function setAgentURI(uint256 agentId, string calldata newURI) external {
        require(agents[agentId].owner == msg.sender, "Not agent owner");
        agents[agentId].metadataUri = newURI;
        emit MetadataUpdated(agentId, newURI);
    }

    /// @notice ERC-8004 getMetadata: reserved keys map to agent fields
    function getMetadata(uint256 agentId, string memory metadataKey) external view returns (bytes memory) {
        bytes32 keyHash = keccak256(bytes(metadataKey));
        if (keyHash == keccak256("reputation")) {
            return abi.encode(agents[agentId].reputationScore);
        } else if (keyHash == keccak256("uri")) {
            return abi.encode(agents[agentId].metadataUri);
        } else if (keyHash == keccak256("active")) {
            return abi.encode(agents[agentId].active);
        }
        return _metadata[agentId][metadataKey];
    }

    /// @notice ERC-8004 setMetadata: owner-only, reserved keys blocked
    function setMetadata(uint256 agentId, string memory metadataKey, bytes memory metadataValue) external {
        require(agents[agentId].owner == msg.sender, "Not agent owner");
        bytes32 keyHash = keccak256(bytes(metadataKey));
        require(
            keyHash != keccak256("reputation") &&
            keyHash != keccak256("uri") &&
            keyHash != keccak256("active"),
            "Reserved metadata key"
        );
        _metadata[agentId][metadataKey] = metadataValue;
        emit MetadataSet(agentId, metadataKey, metadataValue);
    }

    /// @notice ERC-8004 getAgentWallet: returns agent owner address
    function getAgentWallet(uint256 agentId) external view returns (address) {
        return agents[agentId].owner;
    }

    /// @notice ERC165 supportsInterface
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IERC8004).interfaceId || super.supportsInterface(interfaceId);
    }

    /// @dev Internal shared registration logic — single source of truth
    function _createAgent(string calldata uri) internal returns (uint256) {
        uint256 agentId = nextAgentId++;
        agents[agentId] = Agent({
            owner: msg.sender,
            metadataUri: uri,
            reputationScore: 50,
            active: true
        });
        emit AgentRegistered(agentId, msg.sender, uri);
        return agentId;
    }
}

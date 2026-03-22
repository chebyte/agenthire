// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IERC8183 - Agentic Commerce Protocol (subset)
/// @notice Practical subset of ERC-8183 for trustless AI agent job lifecycle
interface IERC8183 {
    function createJob(address provider, address evaluator, uint256 expiredAt, string calldata description, address hook) external returns (uint256);
    function setProvider(uint256 jobId, address provider, bytes calldata optParams) external;
    function setBudget(uint256 jobId, uint256 amount, bytes calldata optParams) external;
    function fund(uint256 jobId, uint256 expectedBudget, bytes calldata optParams) external;
    function submit(uint256 jobId, bytes32 deliverable, bytes calldata optParams) external;
    function complete(uint256 jobId, bytes32 reason, bytes calldata optParams) external;
    function reject(uint256 jobId, bytes32 reason, bytes calldata optParams) external;
    function claimRefund(uint256 jobId) external;
}

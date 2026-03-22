// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IERC8004 - Agent Identity (subset)
/// @notice Practical subset of ERC-8004 for AI agent identity and metadata
interface IERC8004 {
    function register(string calldata agentURI) external returns (uint256 agentId);
    function setAgentURI(uint256 agentId, string calldata newURI) external;
    function getMetadata(uint256 agentId, string memory metadataKey) external view returns (bytes memory);
    function setMetadata(uint256 agentId, string memory metadataKey, bytes memory metadataValue) external;
    function getAgentWallet(uint256 agentId) external view returns (address);

    event AgentRegistered(uint256 indexed agentId, address indexed owner, string agentURI);
}

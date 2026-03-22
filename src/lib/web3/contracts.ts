export const CONTRACT_ADDRESSES = {
  agentRegistry: (process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS || '0x') as `0x${string}`,
  jobManager: (process.env.NEXT_PUBLIC_JOB_MANAGER_ADDRESS || '0x') as `0x${string}`,
  mockUSDC: (process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS || '0x') as `0x${string}`,
} as const

export { default as AgentRegistryABI } from '@/lib/contracts/abis/AgentRegistry.json'
export { default as JobManagerABI } from '@/lib/contracts/abis/JobManager.json'
export { default as MockUSDCABI } from '@/lib/contracts/abis/MockUSDC.json'

'use client'

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESSES, AgentRegistryABI } from '@/lib/web3/contracts'

export function useReadAgent(agentId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.agentRegistry,
    abi: AgentRegistryABI,
    functionName: 'getAgent',
    args: agentId !== undefined ? [agentId] : undefined,
    query: { enabled: agentId !== undefined },
  })
}

export function useAgentCount() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.agentRegistry,
    abi: AgentRegistryABI,
    functionName: 'nextAgentId',
  })
}

export function useRegisterAgent() {
  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const registerAgent = (metadataUri: string) => {
    writeContract({
      address: CONTRACT_ADDRESSES.agentRegistry,
      abi: AgentRegistryABI,
      functionName: 'registerAgent',
      args: [metadataUri],
    })
  }

  return { registerAgent, hash, isPending, isConfirming, isSuccess, error }
}

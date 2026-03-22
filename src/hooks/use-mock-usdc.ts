'use client'

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESSES, MockUSDCABI } from '@/lib/web3/contracts'

export function useUSDCBalance(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.mockUSDC,
    abi: MockUSDCABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })
}

export function useMintUSDC() {
  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const mint = (to: `0x${string}`, amount: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESSES.mockUSDC,
      abi: MockUSDCABI,
      functionName: 'mint',
      args: [to, amount],
    })
  }

  return { mint, hash, isPending, isConfirming, isSuccess, error }
}

export function useApproveUSDC() {
  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const approve = (spender: `0x${string}`, amount: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESSES.mockUSDC,
      abi: MockUSDCABI,
      functionName: 'approve',
      args: [spender, amount],
    })
  }

  return { approve, hash, isPending, isConfirming, isSuccess, error }
}

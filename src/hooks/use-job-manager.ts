'use client'

import { useCallback } from 'react'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESSES, JobManagerABI } from '@/lib/web3/contracts'

// Filtered ABI for the original createJob overload to avoid ambiguity with the ERC-8183 overload
const createJobOriginalABI = JobManagerABI.filter(
  (item: any) =>
    !(item.type === 'function' && item.name === 'createJob' &&
      item.inputs?.[0]?.type === 'address')
)

export function useReadJob(jobId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.jobManager,
    abi: JobManagerABI,
    functionName: 'getJob',
    args: jobId !== undefined ? [jobId] : undefined,
    query: { enabled: jobId !== undefined },
  })
}

export function useReadBid(jobId: bigint | undefined, bidId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.jobManager,
    abi: JobManagerABI,
    functionName: 'getBid',
    args: jobId !== undefined && bidId !== undefined ? [jobId, bidId] : undefined,
    query: { enabled: jobId !== undefined && bidId !== undefined },
  })
}

export function useJobBidCount(jobId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.jobManager,
    abi: JobManagerABI,
    functionName: 'getJobBidCount',
    args: jobId !== undefined ? [jobId] : undefined,
    query: { enabled: jobId !== undefined },
  })
}

export function useCreateJob() {
  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const createJob = (metadataUri: string, budget: bigint, token: `0x${string}`, reputationThreshold: bigint, evaluator: `0x${string}`) => {
    writeContract({
      address: CONTRACT_ADDRESSES.jobManager,
      abi: createJobOriginalABI,
      functionName: 'createJob',
      args: [metadataUri, budget, token, reputationThreshold, evaluator],
    })
  }

  return { createJob, hash, isPending, isConfirming, isSuccess, error }
}

export function usePlaceBidWithSignature() {
  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const placeBidWithSignature = useCallback((
    jobId: bigint,
    agentId: bigint,
    amount: bigint,
    metadataUri: string,
    deadline: bigint,
    v: number,
    r: `0x${string}`,
    s: `0x${string}`,
  ) => {
    writeContract({
      address: CONTRACT_ADDRESSES.jobManager,
      abi: JobManagerABI,
      functionName: 'placeBidWithSignature',
      args: [jobId, agentId, amount, metadataUri, deadline, v, r, s],
    })
  }, [writeContract])

  return { placeBidWithSignature, hash, isPending, isConfirming, isSuccess, error }
}

export function usePlaceBidWithSignatureAndSelect() {
  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const placeBidWithSignatureAndSelect = useCallback((
    jobId: bigint,
    agentId: bigint,
    amount: bigint,
    metadataUri: string,
    deadline: bigint,
    v: number,
    r: `0x${string}`,
    s: `0x${string}`,
  ) => {
    writeContract({
      address: CONTRACT_ADDRESSES.jobManager,
      abi: JobManagerABI,
      functionName: 'placeBidWithSignatureAndSelect',
      args: [jobId, agentId, amount, metadataUri, deadline, v, r, s],
    })
  }, [writeContract])

  return { placeBidWithSignatureAndSelect, hash, isPending, isConfirming, isSuccess, error }
}

export function useSelectProvider() {
  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const selectProvider = useCallback((jobId: bigint, bidId: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESSES.jobManager,
      abi: JobManagerABI,
      functionName: 'selectProvider',
      args: [jobId, bidId],
    })
  }, [writeContract])

  return { selectProvider, hash, isPending, isConfirming, isSuccess, error }
}

export function useFundJob() {
  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const fundJob = useCallback((jobId: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESSES.jobManager,
      abi: JobManagerABI,
      functionName: 'fundJob',
      args: [jobId],
    })
  }, [writeContract])

  return { fundJob, hash, isPending, isConfirming, isSuccess, error }
}

export function useSubmitDeliverable() {
  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const submitDeliverable = (jobId: bigint, deliverableUri: string) => {
    writeContract({
      address: CONTRACT_ADDRESSES.jobManager,
      abi: JobManagerABI,
      functionName: 'submitDeliverable',
      args: [jobId, deliverableUri],
    })
  }

  return { submitDeliverable, hash, isPending, isConfirming, isSuccess, error }
}

export function useApproveDeliverable() {
  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const approveDeliverable = (jobId: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESSES.jobManager,
      abi: JobManagerABI,
      functionName: 'approveDeliverable',
      args: [jobId],
    })
  }

  return { approveDeliverable, hash, isPending, isConfirming, isSuccess, error }
}

export function useRejectDeliverable() {
  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const rejectDeliverable = (jobId: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESSES.jobManager,
      abi: JobManagerABI,
      functionName: 'rejectDeliverable',
      args: [jobId],
    })
  }

  return { rejectDeliverable, hash, isPending, isConfirming, isSuccess, error }
}

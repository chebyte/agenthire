'use client'

import { useMemo, useState, useEffect } from 'react'
import { type Abi } from 'viem'
import { useReadContract, useReadContracts } from 'wagmi'
import { CONTRACT_ADDRESSES, JobManagerABI } from '@/lib/web3/contracts'
import { fetchFromIPFS } from '@/lib/ipfs/gateway'
import type { Job, JobMetadata, JobStatus } from '@/types/job'

const jobManagerAbi = JobManagerABI as Abi

type JobData = {
  client: string
  provider: string
  evaluator: string
  metadataUri: string
  deliverableUri: string
  budget: bigint
  token: string
  reputationThreshold: bigint
  selectedBidId: bigint
  selectedAgentId: bigint
  fundedAt: bigint
  submittedAt: bigint
  resolvedAt: bigint
  status: number
}

export function useJobs() {
  // Step A: Get total job count
  const { data: nextJobId, refetch: refetchCount } = useReadContract({
    address: CONTRACT_ADDRESSES.jobManager,
    abi: jobManagerAbi,
    functionName: 'nextJobId',
  })

  const jobCount = nextJobId ? Number(nextJobId) - 1 : 0

  // Step B: Batch-fetch all jobs via multicall
  const jobCalls = useMemo(() => {
    if (jobCount === 0) return []
    return Array.from({ length: jobCount }, (_, i) => ({
      address: CONTRACT_ADDRESSES.jobManager,
      abi: jobManagerAbi,
      functionName: 'getJob' as const,
      args: [BigInt(i + 1)],
    }))
  }, [jobCount])

  const { data: jobResults, refetch: refetchJobs } = useReadContracts({
    contracts: jobCalls,
    query: { enabled: jobCalls.length > 0 },
  })

  // Step C: Parse raw JobData structs into Job[]
  const jobs: Job[] = useMemo(() => {
    if (!jobResults) return []
    const parsed: Job[] = []
    jobResults.forEach((result, i) => {
      if (result.status !== 'success' || !result.result) return
      const raw = result.result as unknown as JobData
      parsed.push({
        id: i + 1,
        client: raw.client,
        provider: raw.provider,
        evaluator: raw.evaluator,
        metadataUri: raw.metadataUri,
        deliverableUri: raw.deliverableUri,
        budget: raw.budget,
        token: raw.token,
        reputationThreshold: Number(raw.reputationThreshold),
        selectedBidId: Number(raw.selectedBidId),
        selectedAgentId: Number(raw.selectedAgentId),
        fundedAt: Number(raw.fundedAt),
        submittedAt: Number(raw.submittedAt),
        resolvedAt: Number(raw.resolvedAt),
        status: raw.status as JobStatus,
      })
    })
    return parsed
  }, [jobResults])

  // Step D: Fetch IPFS metadata for each job
  const [metadataMap, setMetadataMap] = useState<Map<number, JobMetadata>>(new Map())

  useEffect(() => {
    if (jobs.length === 0) return

    const jobsWithUri = jobs.filter(
      (j) => j.metadataUri && !metadataMap.has(j.id)
    )
    if (jobsWithUri.length === 0) return

    let cancelled = false

    const fetchAll = async () => {
      const newEntries = new Map<number, JobMetadata>()
      await Promise.allSettled(
        jobsWithUri.map(async (job) => {
          try {
            const meta = await fetchFromIPFS<JobMetadata>(job.metadataUri)
            newEntries.set(job.id, meta)
          } catch {
            // IPFS fetch failed — job will show fallback title
          }
        })
      )
      if (!cancelled && newEntries.size > 0) {
        setMetadataMap((prev) => {
          const merged = new Map(prev)
          for (const [k, v] of newEntries) merged.set(k, v)
          return merged
        })
      }
    }

    fetchAll()
    return () => { cancelled = true }
    // Re-run when job list changes (by length, to avoid infinite loops)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs.length])

  // Step E: Merge metadata into jobs
  const jobsWithMetadata: Job[] = useMemo(() => {
    return jobs.map((job) => ({
      ...job,
      metadata: metadataMap.get(job.id),
    }))
  }, [jobs, metadataMap])

  const isLoading = nextJobId === undefined || (jobCount > 0 && !jobResults)

  const refetch = () => {
    refetchCount()
    refetchJobs()
  }

  return { jobs: jobsWithMetadata, isLoading, refetch }
}

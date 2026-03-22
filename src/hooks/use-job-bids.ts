'use client'

import { useMemo, useState, useEffect } from 'react'
import { type Abi } from 'viem'
import { useReadContracts } from 'wagmi'
import { CONTRACT_ADDRESSES, JobManagerABI, AgentRegistryABI } from '@/lib/web3/contracts'
import type { SignedBidData } from '@/hooks/use-demo-mode'

const jobManagerAbi = JobManagerABI as Abi
const agentRegistryAbi = AgentRegistryABI as Abi

// Fallback name map — overridden by on-chain metadata when available
const AGENT_NAMES: Record<number, string> = {
  1: 'MemeSmith',
  2: 'ViralForge',
  3: 'CopySprint',
  4: 'MemeSmith',
  5: 'ViralForge',
  6: 'CopySprint',
}

export interface BidWithMeta {
  bidId: number
  agentId: number
  bidder: string
  amount: bigint
  selected: boolean
  exists: boolean
  agentName: string
  agentScore: number
  signedBid?: SignedBidData
}

export function useJobBids(jobId: bigint | undefined, bidCount: number, signedBids?: SignedBidData[]) {
  // Build getBid call configs for IDs 1..bidCount (on-chain IDs are 1-based)
  const bidCalls = useMemo(() => {
    if (jobId === undefined || bidCount === 0) return []
    return Array.from({ length: bidCount }, (_, i) => ({
      address: CONTRACT_ADDRESSES.jobManager,
      abi: jobManagerAbi,
      functionName: 'getBid' as const,
      args: [jobId, BigInt(i + 1)],
    }))
  }, [jobId, bidCount])

  const { data: bidResults, refetch: refetchBids } = useReadContracts({
    contracts: bidCalls,
    query: { enabled: bidCalls.length > 0 },
  })

  // Extract unique agentIds from bid results to batch-fetch agent scores
  const agentIds = useMemo(() => {
    if (!bidResults) return []
    const ids: bigint[] = []
    for (const result of bidResults) {
      if (result.status === 'success' && result.result) {
        const bid = result.result as { agentId: bigint }
        if (!ids.includes(bid.agentId)) {
          ids.push(bid.agentId)
        }
      }
    }
    return ids
  }, [bidResults])

  const agentCalls = useMemo(() => {
    return agentIds.map((agentId) => ({
      address: CONTRACT_ADDRESSES.agentRegistry,
      abi: agentRegistryAbi,
      functionName: 'getAgent' as const,
      args: [agentId],
    }))
  }, [agentIds])

  const { data: agentResults } = useReadContracts({
    contracts: agentCalls,
    query: { enabled: agentCalls.length > 0 },
  })

  // Build score map + metadata URI map from agent results
  const { scoreMap, metaUriMap } = useMemo(() => {
    const scores = new Map<number, number>()
    const uris = new Map<number, string>()
    if (!agentResults) return { scoreMap: scores, metaUriMap: uris }
    agentIds.forEach((agentId, i) => {
      const result = agentResults[i]
      if (result?.status === 'success' && result.result) {
        const agent = result.result as { reputationScore: bigint; metadataUri: string }
        scores.set(Number(agentId), Number(agent.reputationScore))
        if (agent.metadataUri) {
          uris.set(Number(agentId), agent.metadataUri)
        }
      }
    })
    return { scoreMap: scores, metaUriMap: uris }
  }, [agentResults, agentIds])

  // Fetch real agent names from IPFS metadata URIs
  const [nameMap, setNameMap] = useState<Map<number, string>>(new Map())

  useEffect(() => {
    if (metaUriMap.size === 0) return

    const fetchNames = async () => {
      const newNames = new Map<number, string>()
      for (const [agentId, uri] of metaUriMap) {
        // Skip if we already have this name
        if (nameMap.has(agentId)) {
          newNames.set(agentId, nameMap.get(agentId)!)
          continue
        }
        try {
          const url = uri.startsWith('ipfs://')
            ? uri.replace('ipfs://', 'https://ipfs.io/ipfs/')
            : uri
          const res = await fetch(url)
          if (res.ok) {
            const meta = await res.json()
            if (meta.name) {
              newNames.set(agentId, meta.name)
            }
          }
        } catch {
          // Fall through to AGENT_NAMES fallback
        }
      }
      if (newNames.size > 0) {
        setNameMap((prev) => {
          const merged = new Map(prev)
          for (const [k, v] of newNames) merged.set(k, v)
          return merged
        })
      }
    }

    fetchNames()
  // Only re-run when the set of URIs changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metaUriMap.size])

  // Combine bid data + agent metadata
  const onChainBids: BidWithMeta[] = useMemo(() => {
    if (!bidResults) return []
    const result: BidWithMeta[] = []
    bidResults.forEach((r, i) => {
      if (r.status !== 'success' || !r.result) return
      const bid = r.result as {
        agentId: bigint
        bidder: string
        amount: bigint
        metadataUri: string
        selected: boolean
        exists: boolean
      }
      if (!bid.exists) return
      const agentIdNum = Number(bid.agentId)
      result.push({
        bidId: i + 1, // on-chain IDs are 1-based
        agentId: agentIdNum,
        bidder: bid.bidder,
        amount: bid.amount,
        selected: bid.selected,
        exists: bid.exists,
        agentName: nameMap.get(agentIdNum) ?? AGENT_NAMES[agentIdNum] ?? `Agent #${agentIdNum}`,
        agentScore: scoreMap.get(agentIdNum) ?? 0,
      })
    })
    return result
  }, [bidResults, scoreMap, nameMap])

  // Merge signed bids (off-chain) with on-chain bids, deduplicating by agentId
  const bids: BidWithMeta[] = useMemo(() => {
    if (!signedBids || signedBids.length === 0) return onChainBids

    const onChainAgentIds = new Set(onChainBids.map((b) => b.agentId))

    const offChainBids: BidWithMeta[] = signedBids
      .filter((sb) => !onChainAgentIds.has(sb.agentId))
      .map((sb) => ({
        bidId: 0, // not yet on-chain
        agentId: sb.agentId,
        bidder: sb.bidder,
        amount: BigInt(sb.amount),
        selected: false,
        exists: true,
        agentName: sb.agentName,
        agentScore: sb.agentScore ?? scoreMap.get(sb.agentId) ?? 50,
        signedBid: sb,
      }))

    return [...onChainBids, ...offChainBids]
  }, [onChainBids, signedBids, scoreMap])

  return { bids, refetch: refetchBids }
}

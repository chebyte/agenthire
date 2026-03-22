import { NextResponse } from 'next/server'
import { privateKeyToAccount } from 'viem/accounts'
import { getPublicClient } from '@/lib/web3/server-client'
import { fetchFromIPFS } from '@/lib/ipfs/gateway'
import { uploadJSONWithRetry } from '@/lib/ipfs/pinata'
import { JobManagerABI, AgentRegistryABI, CONTRACT_ADDRESSES } from '@/lib/web3/contracts'
import { signBid } from '@/lib/web3/sign-bid'
import type { AgentMetadata } from '@/types/agent'

// Map agent owner address → private key from env
function getAgentPrivateKey(ownerAddress: string): string | null {
  const keys = [
    process.env.DEMO_AGENT_PRIVATE_KEY_1,
    process.env.DEMO_AGENT_PRIVATE_KEY_2,
    process.env.DEMO_AGENT_PRIVATE_KEY_3,
  ].filter(Boolean) as string[]

  for (const key of keys) {
    const account = privateKeyToAccount(key as `0x${string}`)
    if (account.address.toLowerCase() === ownerAddress.toLowerCase()) return key
  }
  return null
}

export async function POST(request: Request) {
  try {
    const { jobId } = await request.json()
    if (jobId === undefined || jobId === null) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
    }

    const publicClient = getPublicClient()
    const chainId = await publicClient.getChainId()

    // 1. Read job from chain
    const jobData = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.jobManager,
      abi: JobManagerABI,
      functionName: 'getJob',
      args: [BigInt(jobId)],
    }) as { budget: bigint; reputationThreshold: bigint; status: number }

    const { budget, reputationThreshold, status } = jobData

    // Verify job is Open (status 0)
    if (Number(status) !== 0) {
      return NextResponse.json({ error: `Job is not open (status: ${status})` }, { status: 400 })
    }

    // 2. Read all active agents from registry
    const nextAgentId = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.agentRegistry,
      abi: AgentRegistryABI,
      functionName: 'nextAgentId',
    }) as bigint

    const signedBids: Array<{
      jobId: number
      agentId: number
      amount: string
      metadataUri: string
      deadline: string
      v: number
      r: string
      s: string
      agentName: string
      bidder: string
      agentScore: number
    }> = []
    const rejected: Array<{ agentId: number; agentName: string; agentScore: number; bidAmount: number; reason: string }> = []

    const budgetUSDC = Number(budget) / 1e6
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600) // 1 hour from now

    // Iterate in reverse (highest IDs first = latest seed run).
    // Deduplicate by owner so each wallet only bids once.
    const ownersProcessed = new Set<string>()

    for (let i = nextAgentId - BigInt(1); i >= BigInt(1); i--) {
      try {
        const agentData = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.agentRegistry,
          abi: AgentRegistryABI,
          functionName: 'getAgent',
          args: [i],
        }) as { owner: string; metadataUri: string; reputationScore: bigint; active: boolean }

        const { owner, metadataUri: agentMetadataUri, reputationScore, active } = agentData

        if (!active) continue

        // Check if we have a private key for this agent's owner
        const privateKey = getAgentPrivateKey(owner)
        if (!privateKey) continue

        // Skip if this owner already placed a bid (handles duplicate seed runs)
        const ownerLower = owner.toLowerCase()
        if (ownersProcessed.has(ownerLower)) continue
        ownersProcessed.add(ownerLower)

        // Fetch agent metadata from IPFS
        let agentMeta: AgentMetadata
        try {
          agentMeta = await fetchFromIPFS<AgentMetadata>(agentMetadataUri)
        } catch {
          console.warn(`Failed to fetch metadata for agent ${i}, skipping`)
          continue
        }

        // All demo agents bid — vary amount by agent index for differentiation
        const totalProcessed = signedBids.length + rejected.length
        const factors = [0.85, 0.70, 0.55]
        const factorIndex = totalProcessed % factors.length
        const bidAmount = Math.max(1, Math.round(budgetUSDC * factors[factorIndex]))

        // Check reputation threshold before signing
        if (Number(reputationScore) < Number(reputationThreshold)) {
          rejected.push({
            agentId: Number(i),
            agentName: agentMeta.name,
            agentScore: Number(reputationScore),
            bidAmount,
            reason: `Reputation ${reputationScore} below threshold ${reputationThreshold}`,
          })
          continue
        }

        // Upload bid metadata to IPFS
        const bidMetadata = {
          agentId: Number(i),
          agentName: agentMeta.name,
          bidAmount,
          reason: `Demo bid from ${agentMeta.name} — ${(factors[factorIndex] * 100).toFixed(0)}% of budget`,
          timestamp: new Date().toISOString(),
        }
        const bidMetadataUri = await uploadJSONWithRetry(
          bidMetadata as unknown as Record<string, unknown>,
          `bid-agent-${i}-job-${jobId}`,
        )

        // Read signer nonce from contract
        const nonce = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.jobManager,
          abi: JobManagerABI,
          functionName: 'getNonce',
          args: [owner],
        }) as bigint

        // Sign bid off-chain (no on-chain tx!)
        const bidAmountWei = BigInt(bidAmount) * BigInt(1000000) // USDC has 6 decimals
        const { v, r, s } = await signBid({
          jobId: BigInt(jobId),
          agentId: i,
          amount: bidAmountWei,
          metadataUri: bidMetadataUri,
          nonce,
          deadline,
          privateKey: privateKey as `0x${string}`,
          contractAddress: CONTRACT_ADDRESSES.jobManager,
          chainId,
        })

        signedBids.push({
          jobId: Number(jobId),
          agentId: Number(i),
          amount: bidAmountWei.toString(),
          metadataUri: bidMetadataUri,
          deadline: deadline.toString(),
          v,
          r,
          s,
          agentName: agentMeta.name,
          bidder: owner,
          agentScore: Number(reputationScore),
        })
      } catch (error: unknown) {
        const errorStr = String(error)
        console.error(`Agent ${i} signing failed:`, errorStr)
        rejected.push({
          agentId: Number(i),
          agentName: `Agent #${i}`,
          agentScore: 0,
          bidAmount: 0,
          reason: errorStr.slice(0, 200),
        })
      }
    }

    return NextResponse.json({ success: true, signedBids, rejected })
  } catch (error) {
    console.error('notify-agents error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

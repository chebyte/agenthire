import { NextResponse } from 'next/server'
import { createWalletClient, createPublicClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { avalancheFuji } from 'viem/chains'
import { ProviderEngine } from '@/lib/agents/provider-engine'
import { DeterministicMemeStrategy } from '@/lib/agents/strategies/deterministic-meme'
import { uploadJSONWithRetry } from '@/lib/ipfs/pinata'
import { JobManagerABI } from '@/lib/web3/contracts'
import type { StructuredJobInput } from '@/lib/agents/types'

export async function POST(request: Request) {
  const { jobId, agentName, agentKeyIndex, jobInput } = await request.json() as {
    jobId: number
    agentName: string
    agentKeyIndex: number
    jobInput: StructuredJobInput
  }

  const keyEnvVar = `DEMO_AGENT_PRIVATE_KEY_${agentKeyIndex}`
  const privateKey = process.env[keyEnvVar]
  if (!privateKey) {
    return NextResponse.json({ error: `${keyEnvVar} not configured` }, { status: 500 })
  }

  // 1. Produce deliverable using provider engine
  const engine = new ProviderEngine([new DeterministicMemeStrategy(agentName)])
  const deliverable = await engine.produce(jobInput)

  // 2. Upload to IPFS
  const ipfsUri = await uploadJSONWithRetry(deliverable as unknown as Record<string, unknown>, `deliverable-job-${jobId}`)
  deliverable.ipfsUri = ipfsUri

  // 3. Submit onchain
  const transport = http(process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC_URL)
  const account = privateKeyToAccount(privateKey as `0x${string}`)
  const walletClient = createWalletClient({ account, chain: avalancheFuji, transport })
  const publicClient = createPublicClient({ chain: avalancheFuji, transport })

  const hash = await walletClient.writeContract({
    address: process.env.NEXT_PUBLIC_JOB_MANAGER_ADDRESS as `0x${string}`,
    abi: JobManagerABI,
    functionName: 'submitDeliverable',
    args: [BigInt(jobId), ipfsUri],
  })

  await publicClient.waitForTransactionReceipt({ hash })

  return NextResponse.json({ hash, deliverable, success: true })
}

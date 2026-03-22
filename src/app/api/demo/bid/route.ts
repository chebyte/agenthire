import { NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { avalancheFuji } from 'viem/chains'
import { signBid } from '@/lib/web3/sign-bid'
import { JobManagerABI } from '@/lib/web3/contracts'

const JOB_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_JOB_MANAGER_ADDRESS as `0x${string}`

export async function POST(request: Request) {
  const { jobId, agentId, amount, metadataUri, agentKeyIndex, agentName } = await request.json()

  const keyEnvVar = `DEMO_AGENT_PRIVATE_KEY_${agentKeyIndex}`
  const privateKey = process.env[keyEnvVar]
  if (!privateKey) {
    return NextResponse.json({ error: `${keyEnvVar} not configured` }, { status: 500 })
  }

  const transport = http(process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC_URL)
  const publicClient = createPublicClient({ chain: avalancheFuji, transport })
  const account = privateKeyToAccount(privateKey as `0x${string}`)

  try {
    // Read current nonce for this signer
    const nonce = await publicClient.readContract({
      address: JOB_MANAGER_ADDRESS,
      abi: JobManagerABI,
      functionName: 'getNonce',
      args: [account.address],
    }) as bigint

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600)
    const chainId = await publicClient.getChainId()

    const { v, r, s } = await signBid({
      jobId: BigInt(jobId),
      agentId: BigInt(agentId),
      amount: BigInt(amount),
      metadataUri,
      nonce,
      deadline,
      privateKey: privateKey as `0x${string}`,
      contractAddress: JOB_MANAGER_ADDRESS,
      chainId,
    })

    return NextResponse.json({
      success: true,
      signedBid: {
        jobId: Number(jobId),
        agentId: Number(agentId),
        amount: String(amount),
        metadataUri,
        deadline: String(deadline),
        v,
        r,
        s,
        bidder: account.address,
        agentName: agentName || `Agent #${agentId}`,
      },
    })
  } catch (error: unknown) {
    const errorStr = String(error)
    return NextResponse.json({ error: errorStr, success: false }, { status: 500 })
  }
}

import { privateKeyToAccount } from 'viem/accounts'
import { hexToSignature } from 'viem'

const BID_TYPES = {
  Bid: [
    { name: 'jobId', type: 'uint256' },
    { name: 'agentId', type: 'uint256' },
    { name: 'amount', type: 'uint256' },
    { name: 'metadataUri', type: 'string' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const

export async function signBid(params: {
  jobId: bigint
  agentId: bigint
  amount: bigint
  metadataUri: string
  nonce: bigint
  deadline: bigint
  privateKey: `0x${string}`
  contractAddress: `0x${string}`
  chainId: number
}): Promise<{ v: number; r: `0x${string}`; s: `0x${string}` }> {
  const account = privateKeyToAccount(params.privateKey)

  const domain = {
    name: 'AgentHire',
    version: '1',
    chainId: params.chainId,
    verifyingContract: params.contractAddress,
  } as const

  const message = {
    jobId: params.jobId,
    agentId: params.agentId,
    amount: params.amount,
    metadataUri: params.metadataUri,
    nonce: params.nonce,
    deadline: params.deadline,
  }

  const signature = await account.signTypedData({
    domain,
    types: BID_TYPES,
    primaryType: 'Bid',
    message,
  })

  const { v, r, s } = hexToSignature(signature)

  return { v: Number(v), r, s }
}

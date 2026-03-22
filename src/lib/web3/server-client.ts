import { createWalletClient, createPublicClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { avalancheFuji } from 'viem/chains'

const transport = http(process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC_URL)

export function getPublicClient() {
  return createPublicClient({ chain: avalancheFuji, transport })
}

export function getWalletClient(privateKey: string) {
  const account = privateKeyToAccount(privateKey as `0x${string}`)
  return createWalletClient({ account, chain: avalancheFuji, transport })
}

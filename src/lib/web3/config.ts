import { http } from 'wagmi'
import { avalancheFuji } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

export const config = getDefaultConfig({
  appName: 'AgentHire',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  chains: [avalancheFuji],
  transports: {
    [avalancheFuji.id]: http(process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC_URL),
  },
  ssr: true,
})

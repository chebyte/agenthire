'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { useMintUSDC } from '@/hooks/use-mock-usdc'
import { parseUSDC } from '@/lib/utils/format'

export function WalletStatus() {
  const { isConnected } = useAccount()

  return (
    <div className="flex items-center gap-2">
      {isConnected && (
        <MintUSDCButton />
      )}
      <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />
    </div>
  )
}

function MintUSDCButton() {
  const { address } = useAccount()
  const { mint, isPending, isConfirming, isSuccess } = useMintUSDC()

  const loading = isPending || isConfirming

  return (
    <Button
      variant="outline"
      size="sm"
      className="text-xs"
      disabled={loading || !address}
      onClick={() => address && mint(address, parseUSDC(1000))}
    >
      {loading ? 'Minting...' : isSuccess ? 'Minted!' : 'Mint USDC'}
    </Button>
  )
}

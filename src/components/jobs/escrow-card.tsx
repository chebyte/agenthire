'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SnowTraceLinkChip } from '@/components/shared/snowtrace-link-chip'
import { StatusPill } from '@/components/shared/status-pill'
import { formatUSDC } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'

interface EscrowCardProps {
  amount: string
  status: string
  txHash?: string
  onFund?: () => void
  canFund: boolean
  isFunding: boolean
}

const escrowStatusStyles: Record<string, string> = {
  'Not Funded': 'text-gray-400',
  Funded: 'text-violet-400',
  Released: 'text-emerald-400',
  Refunded: 'text-amber-400',
}

export function EscrowCard({
  amount,
  status,
  txHash,
  onFund,
  canFund,
  isFunding,
}: EscrowCardProps) {
  const formattedAmount = formatUSDC(BigInt(amount))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Escrow</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="text-muted-foreground">Token</div>
          <div className="text-right font-medium">Mock USDC</div>
          <div className="text-muted-foreground">Amount</div>
          <div className="text-right font-mono font-semibold">{formattedAmount}</div>
          <div className="text-muted-foreground">Chain</div>
          <div className="text-right font-medium">Avalanche Fuji</div>
          <div className="text-muted-foreground">Status</div>
          <div className="text-right">
            <StatusPill status={status} />
          </div>
        </div>

        {/* Visual flow */}
        <div className="flex items-center justify-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-4 py-3">
          <span className="text-xs font-medium text-muted-foreground">User Wallet</span>
          <ArrowRight
            className={cn(
              'h-4 w-4',
              status === 'Funded' || status === 'Released'
                ? 'text-violet-400'
                : 'text-muted-foreground/40'
            )}
          />
          <span
            className={cn(
              'text-xs font-medium',
              status === 'Funded'
                ? 'text-violet-400'
                : status === 'Released'
                  ? 'text-muted-foreground'
                  : 'text-muted-foreground/60'
            )}
          >
            Escrow
          </span>
          <ArrowRight
            className={cn(
              'h-4 w-4',
              status === 'Released' ? 'text-emerald-400' : 'text-muted-foreground/40'
            )}
          />
          <span
            className={cn(
              'text-xs font-medium',
              status === 'Released' ? 'text-emerald-400' : 'text-muted-foreground/60'
            )}
          >
            Provider
          </span>
        </div>

        {/* TX hash */}
        {txHash && (
          <div className="flex justify-end">
            <SnowTraceLinkChip txHash={txHash} label="View TX" />
          </div>
        )}

        {/* Fund button */}
        {canFund && status === 'Not Funded' && onFund && (
          <Button className="w-full" onClick={onFund} disabled={isFunding}>
            {isFunding ? 'Funding...' : 'Fund Job'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

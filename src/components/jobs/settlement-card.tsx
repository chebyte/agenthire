'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SnowTraceLinkChip } from '@/components/shared/snowtrace-link-chip'
import { ReputationBadge } from '@/components/shared/reputation-badge'
import { formatUSDC } from '@/lib/utils/format'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Check, X } from 'lucide-react'

interface SettlementCardProps {
  amount: string
  oldScore: number
  newScore: number
  txHash?: string
  result: 'approved' | 'rejected'
}

export function SettlementCard({
  amount,
  oldScore,
  newScore,
  txHash,
  result,
}: SettlementCardProps) {
  const isApproved = result === 'approved'
  const delta = newScore - oldScore
  const deltaStr = delta >= 0 ? `+${delta}` : `${delta}`
  const formattedAmount = formatUSDC(BigInt(amount))
  const title = isApproved ? 'Atomic Settlement Completed' : 'Deliverable Rejected'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card
        className={cn(
          'relative overflow-hidden',
          isApproved
            ? 'ring-1 ring-emerald-500/30 shadow-[0_0_24px_-6px_rgba(16,185,129,0.2)]'
            : 'ring-1 ring-red-500/30 shadow-[0_0_24px_-6px_rgba(239,68,68,0.2)]'
        )}
      >
        {/* Glow overlay */}
        <motion.div
          className={cn(
            'pointer-events-none absolute inset-0 rounded-xl',
            isApproved
              ? 'bg-gradient-to-b from-emerald-500/5 to-transparent'
              : 'bg-gradient-to-b from-red-500/5 to-transparent'
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.6] }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />

        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isApproved ? (
              <Check className="h-5 w-5 text-emerald-400" />
            ) : (
              <X className="h-5 w-5 text-red-400" />
            )}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Payment */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-muted-foreground">Payment</div>
            <div className="text-right font-mono font-semibold">
              {isApproved ? formattedAmount : '0 USDC (refunded)'}
            </div>
          </div>

          {/* Reputation change */}
          <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-4 py-3">
            <span className="text-sm text-muted-foreground">Reputation</span>
            <div className="flex items-center gap-2">
              <ReputationBadge score={oldScore} />
              <span className="text-muted-foreground">→</span>
              <ReputationBadge score={newScore} />
              <span
                className={cn(
                  'text-xs font-bold',
                  delta >= 0 ? 'text-emerald-400' : 'text-red-400'
                )}
              >
                ({deltaStr})
              </span>
            </div>
          </div>

          {/* Final status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge
              variant={isApproved ? 'default' : 'destructive'}
              className={cn(
                isApproved
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-red-500/10 text-red-400 border-red-500/30'
              )}
            >
              {isApproved ? 'Settled' : 'Rejected'}
            </Badge>
          </div>

          {/* Snowtrace link */}
          {txHash && (
            <div className="flex justify-end">
              <SnowTraceLinkChip txHash={txHash} label="View on Snowtrace" />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

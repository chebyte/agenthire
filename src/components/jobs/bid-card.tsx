'use client'

import { cn } from '@/lib/utils'
import { ReputationBadge } from '@/components/shared/reputation-badge'
import { Button } from '@/components/ui/button'

interface BidCardProps {
  bid: {
    agentId: number
    bidder: string
    amount: bigint
    selected: boolean
    exists: boolean
  }
  agentName: string
  agentScore: number
  rejected?: boolean
  rejectedReason?: string
  onSelect?: () => void
  isClientView: boolean
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-cyan-600',
    'bg-red-600',
    'bg-violet-600',
    'bg-emerald-600',
    'bg-amber-600',
    'bg-rose-600',
    'bg-teal-600',
    'bg-indigo-600',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function BidCard({
  bid,
  agentName,
  agentScore,
  rejected,
  rejectedReason,
  onSelect,
  isClientView,
}: BidCardProps) {
  const initials = getInitials(agentName)
  const avatarColor = getAvatarColor(agentName)
  const formattedAmount = Number(bid.amount) / 1e6

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-colors',
        rejected
          ? 'border-red-500/30 bg-red-500/5'
          : bid.selected
            ? 'border-red-500/30 bg-red-500/5'
            : 'border-border/50 bg-muted/20 hover:bg-muted/40'
      )}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Provider info */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white',
              avatarColor
            )}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{agentName}</span>
              <ReputationBadge score={agentScore} />
            </div>
            <p className="text-xs text-muted-foreground font-mono truncate">
              Agent #{bid.agentId}
            </p>
          </div>
        </div>

        {/* Amount + action */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-mono font-semibold text-sm">
            {formattedAmount.toLocaleString()} USDC
          </span>

          {rejected ? (
            <span className="inline-flex items-center rounded-full bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 text-xs font-medium text-red-400">
              REJECTED
            </span>
          ) : bid.selected ? (
            <span className="inline-flex items-center rounded-full bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 text-xs font-medium text-red-400">
              Selected
            </span>
          ) : isClientView && onSelect ? (
            <Button size="sm" onClick={onSelect}>
              Select
            </Button>
          ) : null}
        </div>
      </div>

      {rejected && rejectedReason && (
        <p className="mt-2 text-xs text-red-400">{rejectedReason}</p>
      )}
    </div>
  )
}

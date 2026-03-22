'use client'

import { cn } from '@/lib/utils'
import { SnowTraceLinkChip } from '@/components/shared/snowtrace-link-chip'

interface TimelineEventProps {
  title: string
  description: string
  timestamp?: string
  txHash?: string
  status: 'completed' | 'rejected' | 'pending'
}

const dotStyles: Record<TimelineEventProps['status'], string> = {
  completed: 'bg-emerald-500 shadow-emerald-500/30',
  rejected: 'bg-red-500 shadow-red-500/30',
  pending: 'bg-gray-500/50',
}

const textStyles: Record<TimelineEventProps['status'], string> = {
  completed: 'text-foreground',
  rejected: 'text-red-400',
  pending: 'text-muted-foreground',
}

export function TimelineEvent({
  title,
  description,
  timestamp,
  txHash,
  status,
}: TimelineEventProps) {
  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {/* Vertical line */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'mt-1 h-3 w-3 shrink-0 rounded-full shadow-sm',
            dotStyles[status]
          )}
        />
        <div className="w-px flex-1 bg-border/50" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-2">
        <h4
          className={cn(
            'text-sm font-medium leading-none',
            textStyles[status]
          )}
        >
          {title}
        </h4>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        <div className="mt-2 flex items-center gap-2">
          {timestamp && (
            <span className="text-xs text-muted-foreground">{timestamp}</span>
          )}
          {txHash && <SnowTraceLinkChip txHash={txHash} />}
        </div>
      </div>
    </div>
  )
}

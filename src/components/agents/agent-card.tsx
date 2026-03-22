'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ReputationBadge } from '@/components/shared/reputation-badge'
import { getReputationGlow, getReputationLabel } from '@/lib/utils/reputation'
import { cn } from '@/lib/utils'
import type { Agent } from '@/types'

interface AgentCardProps {
  agent: Agent
}

export function AgentCard({ agent }: AgentCardProps) {
  const { metadata, reputationScore, active } = agent
  const label = getReputationLabel(reputationScore)
  const glow = getReputationGlow(label)

  if (!metadata) return null

  const initials = metadata.name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card
        className={cn(
          'bg-card/50 border-border/50 backdrop-blur-sm shadow-lg',
          glow
        )}
      >
        <CardContent className="flex flex-col gap-4">
          {/* Header: Avatar + Name + Specialty + Active badge */}
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-base font-semibold">{metadata.name}</h3>
                {active && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{metadata.specialty}</p>
            </div>
          </div>

          {/* Description */}
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {metadata.description}
          </p>

          {/* Reputation */}
          <div>
            <ReputationBadge score={reputationScore} />
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="font-semibold">{Math.round(metadata.stats.successRate * 100)}%</p>
              <p className="text-muted-foreground">Success</p>
            </div>
            <div>
              <p className="font-semibold">{metadata.stats.avgBid} USDC</p>
              <p className="text-muted-foreground">Avg Bid</p>
            </div>
            <div>
              <p className="font-semibold">{metadata.stats.completedJobs}</p>
              <p className="text-muted-foreground">Jobs</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Link href={`/agents/${agent.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">View Profile</Button>
            </Link>
            <Link href="/jobs/new" className="flex-1">
              <Button size="sm" className="w-full">Hire</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

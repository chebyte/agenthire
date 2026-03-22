'use client'

import { Button } from '@/components/ui/button'
import { ReputationBadge } from '@/components/shared/reputation-badge'
import { SnowTraceLinkChip } from '@/components/shared/snowtrace-link-chip'
import { shortenAddress } from '@/lib/utils/format'
import { ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import type { Agent } from '@/types'

interface AgentProfileHeaderProps {
  agent: Agent
}

const avatarColors = [
  'bg-cyan-500',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-red-500',
]

function getAvatarColor(id: number) {
  return avatarColors[id % avatarColors.length]
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function AgentProfileHeader({ agent }: AgentProfileHeaderProps) {
  const meta = agent.metadata
  const name = meta?.name ?? `Agent #${agent.id}`
  const isVerified = agent.reputationScore >= 60

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
      {/* Avatar */}
      <div
        className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white ${getAvatarColor(agent.id)}`}
      >
        {getInitials(name)}
      </div>

      {/* Info */}
      <div className="flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{name}</h1>
          {isVerified && (
            <ShieldCheck className="h-5 w-5 text-red-400" />
          )}
          <ReputationBadge score={agent.reputationScore} />
        </div>

        {meta?.description && (
          <p className="text-muted-foreground max-w-2xl">{meta.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="font-mono">{shortenAddress(agent.owner)}</span>
          <span className="text-border">|</span>
          <span className="truncate text-xs">{agent.metadataUri}</span>
          <SnowTraceLinkChip address={agent.owner} label="Snowtrace" />
        </div>

        <div className="pt-1">
          <Link href="/jobs/new">
            <Button size="sm">Hire this Agent</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

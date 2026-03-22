'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusPill } from '@/components/shared/status-pill'
import { formatUSDC, shortenAddress } from '@/lib/utils/format'
import type { Job } from '@/types/job'

const JOB_STATUS_LABELS: Record<number, string> = {
  0: 'Open',
  1: 'Selected',
  2: 'Funded',
  3: 'Submitted',
  4: 'Approved',
  5: 'Rejected',
  6: 'Cancelled',
}

interface JobCardProps {
  job: Job
}

export function JobCard({ job }: JobCardProps) {
  const title = job.metadata?.title || `Job #${job.id}`
  const description = job.metadata?.description || 'Loading metadata...'
  const category = job.metadata?.category || '—'
  const statusLabel = JOB_STATUS_LABELS[job.status] ?? 'Open'

  return (
    <Card className="bg-card/50 border-border/50 backdrop-blur-sm shadow-lg">
      <CardContent className="flex flex-col gap-4">
        {/* Header: Title + Status */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-base font-semibold">{title}</h3>
          <StatusPill status={statusLabel} className="shrink-0" />
        </div>

        {/* Description */}
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {description}
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className="font-semibold">{formatUSDC(job.budget)}</p>
            <p className="text-muted-foreground">Budget</p>
          </div>
          <div>
            <p className="font-semibold">{category}</p>
            <p className="text-muted-foreground">Category</p>
          </div>
          <div>
            <p className="font-semibold">{job.reputationThreshold}</p>
            <p className="text-muted-foreground">Min Rep</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            by {shortenAddress(job.client)}
          </span>
          <Link href={`/jobs/${job.id}`}>
            <Button variant="outline" size="sm">View Job</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

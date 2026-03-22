'use client'

import { TimelineEvent } from '@/components/jobs/timeline-event'

interface TimelineEventData {
  title: string
  description: string
  status: 'completed' | 'rejected' | 'pending'
  txHash?: string
  timestamp?: string
}

interface TimelineProps {
  jobStatus: number
  events?: TimelineEventData[]
}

// Job status enum: Open=0, ProviderSelected=1, Funded=2, Submitted=3, Approved=4, Rejected=5, Cancelled=6

function buildDefaultEvents(jobStatus: number): TimelineEventData[] {
  const steps: Array<{
    title: string
    descriptionDone: string
    descriptionPending: string
    minStatus: number
    rejectedAt?: number
  }> = [
    {
      title: 'Job Created',
      descriptionDone: 'Job was posted to the marketplace.',
      descriptionPending: 'Job will be posted to the marketplace.',
      minStatus: -1, // always shown as completed if job exists
    },
    {
      title: 'Bidding Open',
      descriptionDone: 'Agents submitted bids for the job.',
      descriptionPending: 'Agents can submit bids for the job.',
      minStatus: -1, // always shown as completed if job exists
    },
    {
      title: 'Provider Selected',
      descriptionDone: 'A provider was selected from the bids.',
      descriptionPending: 'Client will select a provider.',
      minStatus: 1,
    },
    {
      title: 'Escrow Funded',
      descriptionDone: 'Budget deposited into escrow contract.',
      descriptionPending: 'Budget will be deposited into escrow.',
      minStatus: 2,
    },
    {
      title: 'Deliverable Submitted',
      descriptionDone: 'Provider submitted the deliverable.',
      descriptionPending: 'Provider will submit the deliverable.',
      minStatus: 3,
    },
    {
      title: 'Evaluation Completed',
      descriptionDone:
        jobStatus === 5
          ? 'Deliverable was rejected by the evaluator.'
          : 'Deliverable was approved by the evaluator.',
      descriptionPending: 'Evaluator will review the deliverable.',
      minStatus: 4,
      rejectedAt: 5,
    },
    {
      title: 'Settlement',
      descriptionDone:
        jobStatus === 5
          ? 'Funds returned to client after rejection.'
          : 'Funds released to provider.',
      descriptionPending: 'Funds will be released upon completion.',
      minStatus: 4,
      rejectedAt: 5,
    },
  ]

  return steps.map((step) => {
    const isCompleted = jobStatus >= step.minStatus
    const isRejected =
      step.rejectedAt !== undefined && jobStatus === step.rejectedAt

    let status: 'completed' | 'rejected' | 'pending'
    if (isRejected) {
      status = 'rejected'
    } else if (isCompleted) {
      status = 'completed'
    } else {
      status = 'pending'
    }

    return {
      title: step.title,
      description: isCompleted ? step.descriptionDone : step.descriptionPending,
      status,
    }
  })
}

export function Timeline({ jobStatus, events }: TimelineProps) {
  const timelineEvents = events ?? buildDefaultEvents(jobStatus)

  return (
    <div className="space-y-0">
      {timelineEvents.map((event, index) => (
        <TimelineEvent
          key={`${event.title}-${index}`}
          title={event.title}
          description={event.description}
          timestamp={event.timestamp}
          txHash={event.txHash}
          status={event.status as 'completed' | 'rejected' | 'pending'}
        />
      ))}
    </div>
  )
}

'use client'

import type { ReputationEvent } from '@/hooks/use-reputation'

interface FeedbackFeedProps {
  events: ReputationEvent[]
}

export function FeedbackFeed({ events }: FeedbackFeedProps) {
  if (events.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No reputation events yet.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-3 pr-4 font-medium">Job</th>
            <th className="pb-3 pr-4 font-medium">Result</th>
            <th className="pb-3 pr-4 font-medium">Score Delta</th>
            <th className="pb-3 pr-4 font-medium">Agent</th>
            <th className="pb-3 font-medium">Time</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event, i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="py-3 pr-4 font-medium">{event.jobTitle}</td>
              <td className="py-3 pr-4">
                <span
                  className={
                    event.result === 'approved'
                      ? 'inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-600 dark:text-green-400'
                      : 'inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-600 dark:text-red-400'
                  }
                >
                  {event.result === 'approved' ? 'Approved' : 'Rejected'}
                </span>
              </td>
              <td className="py-3 pr-4">
                <span
                  className={
                    event.scoreDelta > 0
                      ? 'font-semibold text-green-600 dark:text-green-400'
                      : 'font-semibold text-red-600 dark:text-red-400'
                  }
                >
                  {event.scoreDelta > 0 ? `+${event.scoreDelta}` : event.scoreDelta}
                </span>
              </td>
              <td className="py-3 pr-4">{event.agentName}</td>
              <td className="py-3 text-muted-foreground">{event.timestamp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ReputationBadge } from '@/components/shared/reputation-badge'
import { FeedbackFeed } from '@/components/reputation/feedback-feed'
import {
  useReputationEvents,
  useAllAgentsReputation,
} from '@/hooks/use-reputation'

const OVERVIEW_STATS = [
  { label: 'Total Agents', value: '3' },
  { label: 'Total Jobs Completed', value: '44' },
  { label: 'Average Reputation', value: '66' },
  { label: 'Top Rated Agents', value: '1' },
]

export default function ReputationPage() {
  const { events } = useReputationEvents()
  const { agents } = useAllAgentsReputation()

  const sortedAgents = [...agents].sort((a, b) => b.score - a.score)

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Reputation shaped by outcomes
        </h1>
        <p className="mt-2 text-muted-foreground">
          See which agents deliver and which ones don&apos;t.
        </p>
      </div>

      {/* Overview stat cards */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {OVERVIEW_STATS.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Agent comparison table */}
      <Card className="mb-10">
        <CardHeader>
          <CardTitle>Agent Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Agent</th>
                  <th className="pb-3 pr-4 font-medium">Reputation</th>
                  <th className="pb-3 pr-4 font-medium">Completed Jobs</th>
                  <th className="pb-3 pr-4 font-medium">Success Rate</th>
                  <th className="pb-3 font-medium">Avg Bid</th>
                </tr>
              </thead>
              <tbody>
                {sortedAgents.map((agent) => (
                  <tr key={agent.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">{agent.name}</td>
                    <td className="py-3 pr-4">
                      <ReputationBadge score={agent.score} />
                    </td>
                    <td className="py-3 pr-4">{agent.completedJobs}</td>
                    <td className="py-3 pr-4">{agent.successRate}%</td>
                    <td className="py-3">{agent.avgBid} USDC</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent feedback feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <FeedbackFeed events={events} />
        </CardContent>
      </Card>
    </div>
  )
}

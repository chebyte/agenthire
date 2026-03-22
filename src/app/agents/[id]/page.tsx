import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ReputationBadge } from '@/components/shared/reputation-badge'
import { SnowTraceLinkChip } from '@/components/shared/snowtrace-link-chip'
import { StatusPill } from '@/components/shared/status-pill'
import { AgentProfileHeader } from '@/components/agents/agent-profile-header'
import { DEMO_AGENTS } from '@/lib/data/demo-agents'
import { shortenAddress } from '@/lib/utils/format'
import { getReputationLabel } from '@/lib/utils/reputation'

const SEEDED_FEEDBACK = [
  { job: 'Viral Meme Job', outcome: 'Approved', delta: '+10 rep', positive: true },
  { job: 'Quick Logo', outcome: 'Rejected', delta: '-15 rep', positive: false },
  { job: 'DeFi Dashboard Build', outcome: 'Approved', delta: '+8 rep', positive: true },
]

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const agent = DEMO_AGENTS.find((a) => String(a.id) === id)

  if (!agent) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Agent not found</h1>
        <p className="mt-2 text-muted-foreground">
          No agent exists with ID &ldquo;{id}&rdquo;.
        </p>
      </div>
    )
  }

  const meta = agent.metadata
  const label = getReputationLabel(agent.reputationScore)

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* Header */}
      <AgentProfileHeader agent={agent} />

      <Separator />

      {/* Two-column layout */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {meta?.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Bio</h4>
                  <p>{meta.description}</p>
                </div>
              )}
              {meta?.specialty && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Specialty</h4>
                  <p>{meta.specialty}</p>
                </div>
              )}
              {meta?.tags && meta.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {meta.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reputation */}
          <Card>
            <CardHeader>
              <CardTitle>Reputation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>
                    Score: <span className="font-bold">{agent.reputationScore}</span> / 100
                  </span>
                  <ReputationBadge score={agent.reputationScore} />
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all"
                    style={{ width: `${Math.min(agent.reputationScore, 100)}%` }}
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Recent Feedback
                </h4>
                <ul className="space-y-2">
                  {SEEDED_FEEDBACK.map((fb) => (
                    <li
                      key={fb.job}
                      className="flex items-center justify-between rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-sm"
                    >
                      <span>
                        {fb.job} &mdash;{' '}
                        <span
                          className={
                            fb.positive ? 'text-emerald-400' : 'text-red-400'
                          }
                        >
                          {fb.outcome}
                        </span>
                      </span>
                      <span
                        className={`font-mono text-xs ${fb.positive ? 'text-emerald-400' : 'text-red-400'}`}
                      >
                        {fb.delta}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          {meta?.skills && meta.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {meta.skills.map((skill) => (
                    <div
                      key={skill.name}
                      className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-2"
                    >
                      <h4 className="font-semibold">{skill.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {skill.description}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          Pricing:{' '}
                          <span className="text-foreground">{skill.pricingModel}</span>
                        </span>
                        <span>
                          SLA:{' '}
                          <span className="text-foreground">{skill.sla}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Onchain */}
          <Card>
            <CardHeader>
              <CardTitle>Onchain</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Registration Status</span>
                <StatusPill status={agent.active ? 'Active' : 'Inactive'} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Metadata URI</span>
                <span className="font-mono text-xs truncate max-w-[260px]">
                  {agent.metadataUri}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network</span>
                <span>Avalanche Fuji</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Agent ID</span>
                <span className="font-mono">{agent.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Explorer</span>
                <SnowTraceLinkChip address={agent.owner} label="View on Snowtrace" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <StatusPill status={agent.active ? 'Active' : 'Inactive'} />
              </div>
              {meta?.stats && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg Bid</span>
                    <span className="font-mono">{meta.stats.avgBid} USDC</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Success Rate</span>
                    <span className="font-mono">{meta.stats.successRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Completed Jobs</span>
                    <span className="font-mono">{meta.stats.completedJobs}</span>
                  </div>
                </>
              )}
              {meta?.evaluatorMode && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Evaluator Mode</span>
                  <Badge variant="outline" className="capitalize">
                    {meta.evaluatorMode}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

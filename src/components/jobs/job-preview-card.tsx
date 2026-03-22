import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusPill } from '@/components/shared/status-pill'
import { ReputationBadge } from '@/components/shared/reputation-badge'

interface JobPreviewCardProps {
  formData: {
    title: string
    description: string
    category: string
    budget: string
    reputationThreshold: string
  }
}

export function JobPreviewCard({ formData }: JobPreviewCardProps) {
  const threshold = Number(formData.reputationThreshold) || 60

  return (
    <Card className="sticky top-24 border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {formData.title || 'Untitled Job'}
          </CardTitle>
          <StatusPill status="Draft" />
        </div>
        {formData.description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-3">
            {formData.description}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Budget</span>
          <span className="font-medium">
            {formData.budget ? `${formData.budget} USDC` : '--'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Category</span>
          <span className="font-medium">
            {formData.category || '--'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Reputation threshold</span>
          <ReputationBadge score={threshold} />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Evaluator</span>
          <span className="font-medium">Client Manual</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Token</span>
          <span className="font-medium">Mock USDC</span>
        </div>

        <div className="border-t border-border/50 pt-4">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Bid gating:</span>{' '}
            Agents with reputation below {threshold} will be rejected
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Settlement flow:</span>{' '}
            bid &rarr; select &rarr; fund &rarr; deliver &rarr; settle
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

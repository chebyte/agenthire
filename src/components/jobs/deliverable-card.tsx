'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Check, X, ExternalLink } from 'lucide-react'

interface DeliverableCardProps {
  deliverable: {
    title: string
    content: Record<string, unknown>
    metadata: {
      createdBy: string
      timestamp: string
      category: string
    }
    ipfsUri?: string
  }
  onApprove?: () => void
  onReject?: () => void
  canEvaluate: boolean
  isApproving: boolean
  isRejecting: boolean
}

const contentFieldLabels: Record<string, string> = {
  meme_text_top: 'Top Text',
  meme_text_bottom: 'Bottom Text',
  caption: 'Caption',
  image_prompt: 'Image Prompt',
}

export function DeliverableCard({
  deliverable,
  onApprove,
  onReject,
  canEvaluate,
  isApproving,
  isRejecting,
}: DeliverableCardProps) {
  const isActing = isApproving || isRejecting
  const submittedAt = new Date(deliverable.metadata.timestamp).toLocaleString()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{deliverable.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Content fields */}
        <div className="space-y-3">
          {Object.entries(deliverable.content).map(([key, value]) => {
            const label = contentFieldLabels[key] || key
            return (
              <div key={key} className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {label}
                </p>
                <p className="text-sm rounded-md border border-border/50 bg-muted/20 px-3 py-2">
                  {String(value)}
                </p>
              </div>
            )
          })}
        </div>

        {/* IPFS link */}
        {deliverable.ipfsUri && (
          <a
            href={deliverable.ipfsUri}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            IPFS URI
            <ExternalLink className="h-3 w-3" />
          </a>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-2 text-sm border-t border-border/50 pt-3">
          <div className="text-muted-foreground">Submitted by</div>
          <div className="text-right font-medium">{deliverable.metadata.createdBy}</div>
          <div className="text-muted-foreground">Submitted at</div>
          <div className="text-right text-muted-foreground">{submittedAt}</div>
          <div className="text-muted-foreground">Category</div>
          <div className="text-right font-medium">{deliverable.metadata.category}</div>
        </div>

        {/* Approve / Reject buttons */}
        {canEvaluate && (
          <div className="flex gap-3 pt-1">
            <Button
              className="flex-1"
              onClick={onApprove}
              disabled={isActing}
            >
              <Check className="mr-1.5 h-4 w-4" />
              {isApproving ? 'Approving...' : 'Approve'}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={onReject}
              disabled={isActing}
            >
              <X className="mr-1.5 h-4 w-4" />
              {isRejecting ? 'Rejecting...' : 'Reject'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

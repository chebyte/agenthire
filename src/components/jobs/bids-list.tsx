'use client'

import { BidCard } from '@/components/jobs/bid-card'

interface Bid {
  agentId: number
  bidder: string
  amount: bigint
  selected: boolean
  exists: boolean
}

interface BidWithMeta extends Bid {
  agentName: string
  agentScore: number
}

interface RejectedBid {
  agentId: number
  agentName: string
  agentScore: number
  bidAmount: number
  reason: string
}

interface BidsListProps {
  bids: BidWithMeta[]
  rejectedBids: RejectedBid[]
  onSelectBid?: (bidId: number) => void
  isClientView: boolean
  isSubmittingSignedBid?: boolean
}

export function BidsList({
  bids,
  rejectedBids,
  onSelectBid,
  isClientView,
  isSubmittingSignedBid,
}: BidsListProps) {
  if (bids.length === 0 && rejectedBids.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/50 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No bids yet. Waiting for agents to submit proposals.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {bids.map((bid, index) => (
        <BidCard
          key={`${bid.agentId}-${index}`}
          bid={bid}
          agentName={bid.agentName}
          agentScore={bid.agentScore}
          onSelect={
            onSelectBid && !isSubmittingSignedBid ? () => onSelectBid(index) : undefined
          }
          isClientView={isClientView}
        />
      ))}
      {rejectedBids.map((rb) => (
        <BidCard
          key={`rejected-${rb.agentId}`}
          bid={{
            agentId: rb.agentId,
            bidder: '',
            amount: BigInt(rb.bidAmount) * BigInt(1000000),
            selected: false,
            exists: false,
          }}
          agentName={rb.agentName}
          agentScore={rb.agentScore}
          rejected={true}
          rejectedReason={rb.reason}
          isClientView={isClientView}
        />
      ))}
    </div>
  )
}

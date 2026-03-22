export enum BidStatus {
  Received = 'received',
  Verified = 'verified',
  Rejected = 'rejected',
  Selected = 'selected',
  NotSelected = 'not-selected',
}

export interface Bid {
  id: number
  jobId: number
  agentId: number
  bidder: string
  amount: bigint
  metadataUri: string
  selected: boolean
  exists: boolean
  status: BidStatus
  rejectionReason?: string
}

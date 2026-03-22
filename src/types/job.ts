export enum JobStatus {
  Open = 0,
  ProviderSelected = 1,
  Funded = 2,
  Submitted = 3,
  Approved = 4,
  Rejected = 5,
  Cancelled = 6,
}

export interface JobMetadata {
  title: string
  prompt: string
  category: string
  description: string
  requirements: Record<string, unknown>
}

export interface Job {
  id: number
  client: string
  provider: string
  evaluator: string
  metadataUri: string
  deliverableUri: string
  budget: bigint
  token: string
  reputationThreshold: number
  selectedBidId: number
  selectedAgentId: number
  fundedAt: number
  submittedAt: number
  resolvedAt: number
  status: JobStatus
  metadata?: JobMetadata
}

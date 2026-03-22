export interface StructuredJobInput {
  jobId: number
  prompt: string
  category: string
  budget: number
  requirements: Record<string, unknown>
}

export interface StandardDeliverable {
  title: string
  content: Record<string, unknown>
  metadata: {
    createdBy: string
    timestamp: string
    category: string
  }
  ipfsUri?: string
}

export interface DeliverableStrategy {
  canHandle(job: StructuredJobInput): boolean
  produce(job: StructuredJobInput): Promise<StandardDeliverable>
}

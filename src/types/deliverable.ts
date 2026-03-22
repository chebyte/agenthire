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

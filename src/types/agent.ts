export interface AgentSkill {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  outputSchema: Record<string, unknown>
  pricingModel: string
  sla: string
}

export interface AgentStats {
  successRate: number
  avgBid: number
  completedJobs: number
}

export interface AgentMetadata {
  name: string
  avatar: string
  description: string
  specialty: string
  tags: string[]
  endpointUrl: string
  evaluatorMode: string
  skills: AgentSkill[]
  stats: AgentStats
}

export interface Agent {
  id: number
  owner: string
  metadataUri: string
  reputationScore: number
  active: boolean
  metadata?: AgentMetadata
}

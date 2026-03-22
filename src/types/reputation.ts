export enum ReputationLabel {
  TopRated = 'Top Rated',
  Verified = 'Verified',
  Risky = 'Risky',
  LowTrust = 'Low Trust',
}

export interface ReputationEvent {
  id: string
  agentId: number
  jobId: number
  oldScore: number
  newScore: number
  delta: number
  result: 'approved' | 'rejected'
  evaluator: string
  timestamp: number
}

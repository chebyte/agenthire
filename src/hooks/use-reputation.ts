'use client'

import { DEMO_AGENTS } from '@/lib/data/demo-agents'

export interface ReputationEvent {
  agentId: number
  agentName: string
  jobTitle: string
  result: 'approved' | 'rejected'
  scoreDelta: number
  oldScore: number
  newScore: number
  timestamp: string
}

// Demo reputation events for display
const DEMO_EVENTS: ReputationEvent[] = [
  { agentId: 1, agentName: 'MemeForge AI', jobTitle: 'Viral Meme Job', result: 'approved', scoreDelta: 10, oldScore: 75, newScore: 85, timestamp: '2 min ago' },
  { agentId: 2, agentName: 'CodeCraft Agent', jobTitle: 'Smart Contract Audit', result: 'approved', scoreDelta: 10, oldScore: 62, newScore: 72, timestamp: '15 min ago' },
  { agentId: 3, agentName: 'DataPulse Bot', jobTitle: 'DeFi Dashboard Build', result: 'rejected', scoreDelta: -15, oldScore: 60, newScore: 45, timestamp: '1 hour ago' },
]

export function useReputationEvents() {
  return { events: DEMO_EVENTS, isLoading: false }
}

export function useAllAgentsReputation() {
  const agents = DEMO_AGENTS.map((a) => ({
    id: a.id,
    name: a.metadata?.name || `Agent ${a.id}`,
    score: a.reputationScore,
    completedJobs: a.metadata?.stats?.completedJobs || 0,
    successRate: a.metadata?.stats?.successRate || 0,
    avgBid: a.metadata?.stats?.avgBid || 0,
  }))
  return { agents, isLoading: false }
}

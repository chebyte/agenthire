import { ReputationLabel } from '@/types'

export function getReputationLabel(score: number): ReputationLabel {
  if (score >= 80) return ReputationLabel.TopRated
  if (score >= 60) return ReputationLabel.Verified
  if (score >= 40) return ReputationLabel.Risky
  return ReputationLabel.LowTrust
}

export function getReputationColor(label: ReputationLabel): string {
  switch (label) {
    case ReputationLabel.TopRated: return 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10'
    case ReputationLabel.Verified: return 'text-red-400 border-red-400/30 bg-red-400/10'
    case ReputationLabel.Risky: return 'text-amber-400 border-amber-400/30 bg-amber-400/10'
    case ReputationLabel.LowTrust: return 'text-red-400 border-red-400/30 bg-red-400/10'
  }
}

export function getReputationGlow(label: ReputationLabel): string {
  switch (label) {
    case ReputationLabel.TopRated: return 'shadow-cyan-400/20'
    case ReputationLabel.Verified: return 'shadow-red-400/20'
    case ReputationLabel.Risky: return 'shadow-amber-400/20'
    case ReputationLabel.LowTrust: return 'shadow-red-400/20'
  }
}

export function meetsThreshold(score: number, threshold: number): boolean {
  return score >= threshold
}

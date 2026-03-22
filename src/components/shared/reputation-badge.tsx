import { getReputationLabel, getReputationColor } from '@/lib/utils/reputation'
import { cn } from '@/lib/utils'

interface ReputationBadgeProps {
  score: number
  showScore?: boolean
  className?: string
}

export function ReputationBadge({ score, showScore = true, className }: ReputationBadgeProps) {
  const label = getReputationLabel(score)
  const colorClass = getReputationColor(label)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        colorClass,
        className
      )}
    >
      {showScore && <span className="font-bold">{score}</span>}
      {label}
    </span>
  )
}

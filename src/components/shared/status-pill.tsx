import { cn } from '@/lib/utils'

const statusStyles: Record<string, string> = {
  open: 'bg-green-500/10 text-green-400 border-green-500/30',
  bidding: 'bg-red-500/10 text-red-400 border-red-500/30',
  funded: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  submitted: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/30',
  cancelled: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
  settled: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  active: 'bg-green-500/10 text-green-400 border-green-500/30',
  selected: 'bg-red-500/10 text-red-400 border-red-500/30',
}

interface StatusPillProps {
  status: string
  className?: string
}

export function StatusPill({ status, className }: StatusPillProps) {
  const style = statusStyles[status.toLowerCase()] || statusStyles.open
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        style,
        className
      )}
    >
      {status}
    </span>
  )
}

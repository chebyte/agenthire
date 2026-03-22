import { ExternalLink } from 'lucide-react'
import { snowtraceTxUrl, snowtraceAddressUrl, shortenAddress } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

interface SnowTraceLinkChipProps {
  txHash?: string
  address?: string
  label?: string
  className?: string
}

export function SnowTraceLinkChip({ txHash, address, label, className }: SnowTraceLinkChipProps) {
  const url = txHash ? snowtraceTxUrl(txHash) : address ? snowtraceAddressUrl(address) : ''
  const displayLabel = label || (txHash ? shortenAddress(txHash) : address ? shortenAddress(address) : '')

  if (!url) return null

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1 rounded-md border border-border/50 bg-muted/50 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors',
        className
      )}
    >
      {displayLabel}
      <ExternalLink className="h-3 w-3" />
    </a>
  )
}

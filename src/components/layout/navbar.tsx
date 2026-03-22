'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { WalletStatus } from './wallet-status'

const navItems = [
  { href: '/agents', label: 'Explore Agents' },
  { href: '/jobs', label: 'Explore Jobs' },
  { href: '/agents/register', label: 'Register Agent' },
  { href: '/jobs/new', label: 'Create Job' },
  { href: '/demo', label: 'Live Demo' },
  { href: '/reputation', label: 'Reputation' },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="w-full px-4 flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Agent<span className="text-primary">Hire</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-foreground',
                  pathname === item.href ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <WalletStatus />
      </div>
    </header>
  )
}

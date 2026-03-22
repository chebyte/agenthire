'use client'

import dynamic from 'next/dynamic'

const Providers = dynamic(
  () => import('@/components/layout/providers').then(mod => mod.Providers),
  { ssr: false }
)

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>
}

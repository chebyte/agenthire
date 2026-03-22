'use client'

import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle } from 'lucide-react'
import Link from 'next/link'

const DEMO_STEPS = [
  { label: 'Create Job', description: 'Post a meme-creation job with a preset template', href: '/jobs/new?demo=true' },
  { label: 'Await Bids', description: 'AI agents automatically bid on your job' },
  { label: 'Select Provider', description: 'Choose the best agent based on reputation and price' },
  { label: 'Fund Escrow', description: 'Approve USDC and lock funds in the smart contract' },
  { label: 'Submit Deliverable', description: 'The selected agent produces and submits work' },
  { label: 'Evaluate', description: 'Review the deliverable and approve or dispute' },
  { label: 'Completed', description: 'Funds are released and reputation scores update' },
]

export default function DemoPage() {
  const router = useRouter()
  const { isConnected, chain } = useAccount()

  const isAvalancheFuji = chain?.id === 43113

  const prerequisites = [
    { label: 'Wallet connected', met: isConnected },
    { label: 'On Avalanche Fuji network', met: isAvalancheFuji },
  ]

  return (
    <div className="container mx-auto max-w-3xl py-12 px-4 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Live Demo</h1>
        <p className="text-muted-foreground text-lg">
          Experience the full AgentHire flow on Avalanche Fuji
        </p>
      </div>

      {/* Prerequisites */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Prerequisites</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {prerequisites.map((req) => (
            <div key={req.label} className="flex items-center gap-3">
              {req.met ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              <span className={req.met ? 'text-foreground' : 'text-muted-foreground'}>
                {req.label}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Demo flow overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">7-Step Demo Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">
            This guided demo walks you through the complete lifecycle of an AgentHire job:
            posting a task, receiving bids from AI agents, funding escrow, reviewing deliverables,
            and settling payments with on-chain reputation updates.
          </p>
          <ol className="space-y-4">
            {DEMO_STEPS.map((step, i) => (
              <li key={step.label} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium">
                    {step.href ? (
                      <Link href={step.href} className="underline underline-offset-4 hover:text-primary">
                        {step.label}
                      </Link>
                    ) : (
                      step.label
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Start button */}
      <div className="flex justify-center">
        <Button
          size="lg"
          className="px-8"
          disabled={!isConnected || !isAvalancheFuji}
          onClick={() => router.push('/jobs/new?demo=true')}
        >
          Start Demo
        </Button>
      </div>

      {!isConnected && (
        <p className="text-center text-sm text-muted-foreground">
          Connect your wallet to begin the demo.
        </p>
      )}
    </div>
  )
}

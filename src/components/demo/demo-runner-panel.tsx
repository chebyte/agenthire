'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface DemoRunnerPanelProps {
  stepNumber: number
  totalSteps: number
  stepLabel: string
  instruction: string
  isProcessing: boolean
  error: string | null
  onRetry?: () => void
}

export function DemoRunnerPanel({
  stepNumber,
  totalSteps,
  stepLabel,
  instruction,
  isProcessing,
  error,
  onRetry,
}: DemoRunnerPanelProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      {collapsed ? (
        <Button
          onClick={() => setCollapsed(false)}
          className="rounded-full shadow-lg"
          size="sm"
        >
          Demo: Step {stepNumber}/{totalSteps}
        </Button>
      ) : (
        <Card className="border border-white/20 bg-black/70 backdrop-blur-xl shadow-2xl text-white">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white/60 uppercase tracking-wide">
                Step {stepNumber} of {totalSteps}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCollapsed(true)}
                className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
              >
                &minus;
              </Button>
            </div>

            <h3 className="text-sm font-semibold">{stepLabel}</h3>

            <p className="text-xs text-white/80 leading-relaxed">
              {instruction}
            </p>

            {isProcessing && (
              <div className="flex items-center gap-2 text-xs text-red-300">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Processing...</span>
              </div>
            )}

            {error && (
              <div className="space-y-2">
                <p className="text-xs text-red-400 break-words">{error}</p>
                {onRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                    className="h-7 text-xs border-red-400/50 text-red-300 hover:bg-red-400/10"
                  >
                    Retry
                  </Button>
                )}
              </div>
            )}

            {/* Progress bar */}
            <div className="w-full bg-white/10 rounded-full h-1">
              <div
                className="bg-red-500 h-1 rounded-full transition-all duration-500"
                style={{ width: `${(stepNumber / totalSteps) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

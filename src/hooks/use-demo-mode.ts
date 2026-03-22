'use client'

import { useState, useCallback } from 'react'

export type DemoStep =
  | 'create-job'
  | 'await-bids'
  | 'select-provider'
  | 'fund-escrow'
  | 'submit-deliverable'
  | 'evaluate'
  | 'completed'

const STEPS: { step: DemoStep; label: string; instruction: string }[] = [
  { step: 'create-job', label: 'Create Job', instruction: 'Click "Use hackathon meme demo" preset, then submit the job' },
  { step: 'await-bids', label: 'Await Bids', instruction: 'Triggering 3 agent bids... MemeSmith & CopySprint will pass, ViralForge rejected (rep < threshold)' },
  { step: 'select-provider', label: 'Select Provider', instruction: 'Review the bids and click "Select" on your preferred agent' },
  { step: 'fund-escrow', label: 'Fund Escrow', instruction: 'Approve USDC spend, then click "Fund Job"' },
  { step: 'submit-deliverable', label: 'Submit Deliverable', instruction: 'MemeSmith is producing the deliverable...' },
  { step: 'evaluate', label: 'Evaluate', instruction: 'Review the deliverable and click "Approve"' },
  { step: 'completed', label: 'Completed', instruction: 'Settlement complete! Check the reputation dashboard.' },
]

// Map on-chain JobStatus → demo step index
const STATUS_TO_STEP: Record<number, number> = {
  0: 1, // Open → await-bids
  1: 3, // ProviderSelected → fund-escrow (selection done)
  2: 4, // Funded → submit-deliverable (funding done)
  3: 5, // Submitted → evaluate
  4: 6, // Approved → completed
  5: 6, // Rejected → completed
}

interface RejectedBid {
  agentId: number
  agentName: string
  agentScore: number
  bidAmount: number
  reason: string
}

export interface SignedBidData {
  jobId: number
  agentId: number
  amount: string
  metadataUri: string
  deadline: string
  v: number
  r: string
  s: string
  agentName: string
  bidder: string
  agentScore: number
}

export function useDemoMode() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [jobId, setJobId] = useState<number | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rejectedBids, setRejectedBids] = useState<RejectedBid[]>([])
  const [signedBids, setSignedBids] = useState<SignedBidData[]>([])

  const currentStep = STEPS[currentStepIndex]
  const stepNumber = currentStepIndex + 1
  const totalSteps = STEPS.length

  const goToNextStep = useCallback(() => {
    setCurrentStepIndex(prev => Math.min(prev + 1, STEPS.length - 1))
    setError(null)
  }, [])

  const syncToJobStatus = useCallback((status: number) => {
    const targetStep = STATUS_TO_STEP[status]
    if (targetStep !== undefined) {
      setCurrentStepIndex(prev => Math.max(prev, targetStep))
    }
  }, [])

  const triggerBids = useCallback(async (jobId: number) => {
    setIsProcessing(true)
    setError(null)
    try {
      const response = await fetch('/api/jobs/notify-agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      })
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        throw new Error(errBody.error || `API error ${response.status}`)
      }
      const result = await response.json()

      // Store signed bids from response
      if (result.signedBids) {
        setSignedBids(result.signedBids)
      }

      // Map rejected bids from notify-agents response
      const rejected: RejectedBid[] = (result.rejected || []).map((r: { agentId: number; agentName: string; agentScore: number; bidAmount: number; reason: string }) => ({
        agentId: r.agentId,
        agentName: r.agentName,
        agentScore: r.agentScore,
        bidAmount: r.bidAmount,
        reason: r.reason,
      }))
      setRejectedBids(rejected)

      return result
    } catch (err) {
      setError(String(err))
      throw err
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const triggerDeliverable = useCallback(async (jobId: number, agentName: string, agentKeyIndex: number) => {
    setIsProcessing(true)
    setError(null)
    try {
      const result = await fetch('/api/demo/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          agentName,
          agentKeyIndex,
          jobInput: {
            jobId,
            prompt: 'Generate a viral meme about AI agents winning hackathons',
            category: 'Meme Creation',
            budget: 12,
            requirements: {},
          },
        }),
      }).then(r => r.json())
      return result
    } catch (err) {
      setError(String(err))
      throw err
    } finally {
      setIsProcessing(false)
    }
  }, [])

  return {
    currentStep,
    stepNumber,
    totalSteps,
    jobId,
    setJobId,
    isProcessing,
    error,
    rejectedBids,
    signedBids,
    goToNextStep,
    syncToJobStatus,
    triggerBids,
    triggerDeliverable,
  }
}

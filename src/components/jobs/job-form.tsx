'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useReadContract } from 'wagmi'
import { useCreateJob } from '@/hooks/use-job-manager'
import { CONTRACT_ADDRESSES, JobManagerABI } from '@/lib/web3/contracts'
import { parseUSDC } from '@/lib/utils/format'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SnowTraceLinkChip } from '@/components/shared/snowtrace-link-chip'

type FormData = {
  title: string
  description: string
  category: string
  budget: string
  reputationThreshold: string
}

interface JobFormProps {
  formData: FormData
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  isDemo?: boolean
}

type SubmitState = 'idle' | 'uploading' | 'creating' | 'success'

export function JobForm({ formData, setFormData, isDemo = false }: JobFormProps) {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { createJob, hash, isPending, isConfirming, isSuccess, error } =
    useCreateJob()

  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [createdJobId, setCreatedJobId] = useState<number | null>(null)
  const notifyTriggered = useRef(false)

  // Read nextJobId to derive the real jobId after creation
  const { data: nextJobId, refetch: refetchNextJobId } = useReadContract({
    address: CONTRACT_ADDRESSES.jobManager,
    abi: JobManagerABI,
    functionName: 'nextJobId',
  })

  // After job creation succeeds, derive jobId and notify agents
  useEffect(() => {
    if (isSuccess && !notifyTriggered.current) {
      notifyTriggered.current = true
      refetchNextJobId().then(({ data }) => {
        if (data !== undefined) {
          const realJobId = Number(data) - 1
          setCreatedJobId(realJobId)
          if (isDemo) {
            router.push(`/jobs/${realJobId}?demo=true`)
          }
        }
      })
    }
  }, [isSuccess, refetchNextJobId])

  const update = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const fillPreset = () => {
    setFormData({
      title: 'Viral Meme Job',
      description:
        'Generate a viral meme about AI agents winning hackathons',
      category: 'Meme Creation',
      budget: '12',
      reputationThreshold: '60',
    })
    if (!isDemo) {
      router.replace('/jobs/new?demo=true')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!isConnected || !address) {
      setSubmitError('Please connect your wallet first.')
      return
    }

    if (!formData.title || !formData.description || !formData.category || !formData.budget) {
      setSubmitError('Please fill in all required fields.')
      return
    }

    try {
      // Step 1: Upload metadata to IPFS
      setSubmitState('uploading')
      const metadata = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        evaluatorMode: 'client',
      }

      const res = await fetch('/api/ipfs/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: metadata, name: `job-${formData.title}` }),
      })

      if (!res.ok) {
        throw new Error('Failed to upload metadata to IPFS')
      }

      const { uri } = await res.json()

      // Step 2: Create job onchain
      setSubmitState('creating')
      createJob(
        uri,
        parseUSDC(Number(formData.budget)),
        CONTRACT_ADDRESSES.mockUSDC,
        BigInt(formData.reputationThreshold),
        address
      )
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong')
      setSubmitState('idle')
    }
  }

  // Derive display state from hook + local state
  const displayState: SubmitState =
    isSuccess ? 'success' : isPending || isConfirming ? 'creating' : submitState

  const buttonLabel =
    displayState === 'uploading'
      ? 'Uploading to IPFS...'
      : displayState === 'creating'
        ? 'Creating onchain...'
        : displayState === 'success'
          ? 'Job created!'
          : 'Open Job on Avalanche Fuji'

  const isSubmitting = displayState === 'uploading' || displayState === 'creating'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Job title</Label>
            <Input
              id="title"
              placeholder="e.g. Viral Meme Job"
              value={formData.title}
              onChange={(e) => update('title', e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">What do you need?</Label>
            <Textarea
              id="description"
              placeholder="Describe the task you need an AI agent to complete..."
              rows={4}
              value={formData.description}
              onChange={(e) => update('description', e.target.value)}
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={formData.category}
              onValueChange={(v) => update('category', v ?? '')}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Meme Creation">Meme Creation</SelectItem>
                <SelectItem value="Copywriting">Copywriting</SelectItem>
                <SelectItem value="General">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <Label htmlFor="budget">Max budget (USDC)</Label>
            <Input
              id="budget"
              type="number"
              min="0"
              step="any"
              placeholder="e.g. 12"
              value={formData.budget}
              onChange={(e) => update('budget', e.target.value)}
              required
            />
          </div>

          {/* Reputation threshold */}
          <div className="space-y-2">
            <Label htmlFor="threshold">Reputation threshold</Label>
            <Input
              id="threshold"
              type="number"
              min="0"
              max="100"
              placeholder="60"
              value={formData.reputationThreshold}
              onChange={(e) => update('reputationThreshold', e.target.value)}
              required
            />
          </div>

          {/* Evaluator mode (read-only for v1) */}
          <div className="space-y-2">
            <Label>Evaluator mode</Label>
            <p className="text-sm text-muted-foreground">Client Manual</p>
            <p className="text-xs text-muted-foreground">In the future, evaluation may also be performed by a DAO or another AI agent.</p>
          </div>

          {/* Token (read-only for v1) */}
          <div className="space-y-2">
            <Label>Token</Label>
            <p className="text-sm text-muted-foreground">Mock USDC</p>
          </div>

          {/* Preset button */}
          <Button type="button" variant="outline" onClick={fillPreset}>
            Use hackathon meme demo
          </Button>

          {/* Error display */}
          {(submitError || error) && (
            <p className="text-sm text-destructive">
              {submitError || error?.message}
            </p>
          )}

          {/* Success display */}
          {isSuccess && hash && (
            <div className="space-y-2 rounded-md border border-green-500/30 bg-green-500/10 p-4">
              <p className="text-sm font-medium text-green-400">
                Job created successfully!
              </p>
              <div className="flex items-center gap-2">
                <a
                  href={`/jobs/${createdJobId ?? 1}${isDemo ? '?demo=true' : ''}`}
                  className="text-sm underline underline-offset-4 hover:text-foreground"
                >
                  View job
                </a>
                <SnowTraceLinkChip txHash={hash} label="View on Snowtrace" />
              </div>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || isSuccess || !isConnected}
          >
            {buttonLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

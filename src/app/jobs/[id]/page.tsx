'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useReadJob, useJobBidCount, useFundJob, useSelectProvider, usePlaceBidWithSignatureAndSelect, useApproveDeliverable, useRejectDeliverable } from '@/hooks/use-job-manager'
import { useJobBids } from '@/hooks/use-job-bids'
import { useApproveUSDC, useUSDCBalance, useMintUSDC } from '@/hooks/use-mock-usdc'
import { useDemoMode } from '@/hooks/use-demo-mode'
import { CONTRACT_ADDRESSES } from '@/lib/web3/contracts'
import { StatusPill } from '@/components/shared/status-pill'
import { SnowTraceLinkChip } from '@/components/shared/snowtrace-link-chip'
import { Timeline } from '@/components/jobs/timeline'
import { BidsList } from '@/components/jobs/bids-list'
import { DemoRunnerPanel } from '@/components/demo/demo-runner-panel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'

const JOB_STATUS_LABELS: Record<number, string> = {
  0: 'Open',
  1: 'Selected',
  2: 'Funded',
  3: 'Submitted',
  4: 'Approved',
  5: 'Rejected',
  6: 'Cancelled',
}

type JobData = {
  client: string
  provider: string
  evaluator: string
  metadataUri: string
  deliverableUri: string
  budget: bigint
  token: string
  reputationThreshold: bigint
  selectedBidId: bigint
  selectedAgentId: bigint
  fundedAt: bigint
  submittedAt: bigint
  resolvedAt: bigint
  status: number
}

export default function LiveJobPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const jobId = params.id as string
  const isDemo = searchParams.get('demo') === 'true'

  const jobIdBigInt =
    jobId && !isNaN(Number(jobId)) ? BigInt(jobId) : undefined

  // Always read from chain
  const { data: jobData, refetch: refetchJob } = useReadJob(jobIdBigInt)
  const { data: bidCount, refetch: refetchBidCount } = useJobBidCount(jobIdBigInt)

  const job = jobData ? (jobData as unknown as JobData) : undefined
  const jobStatus = job ? Number(job.status) : undefined
  const jobBudget = job ? Number(job.budget) : 0
  const statusLabel = jobStatus !== undefined ? (JOB_STATUS_LABELS[jobStatus] ?? 'Open') : 'Loading...'
  const formattedBudget = (jobBudget / 1e6).toLocaleString()

  // Demo mode hook (step panel only)
  const demo = useDemoMode()

  // Read bids from chain + merge signed bids
  const { bids, refetch: refetchAllBids } = useJobBids(jobIdBigInt, Number(bidCount ?? 0), demo.signedBids)

  // Select provider hook (real on-chain)
  const { selectProvider, isPending: selectPending } = useSelectProvider()

  // Combined: place signed bid + select provider in one tx
  const {
    placeBidWithSignatureAndSelect,
    isPending: signedBidPending,
    isConfirming: signedBidConfirming,
    isSuccess: signedBidSuccess,
  } = usePlaceBidWithSignatureAndSelect()

  // Refetch bids chain: bidCount → wait for update → refetch individual bids
  const refetchBidsChain = useCallback(async () => {
    const result = await refetchBidCount()
    const count = Number(result.data ?? 0)
    if (count > 0) {
      // bidCalls recompute on next render; give React a tick then refetch bids
      setTimeout(() => refetchAllBids(), 100)
    }
  }, [refetchBidCount, refetchAllBids])

  // Poll for updates while job is in-progress (status 0–3) or demo mode
  useEffect(() => {
    const shouldPoll = jobStatus === undefined || jobStatus <= 3 || isDemo
    if (!shouldPoll) return
    const interval = setInterval(() => {
      refetchJob()
      refetchBidsChain()
    }, 5000)
    return () => clearInterval(interval)
  }, [jobStatus, isDemo, refetchJob, refetchBidsChain])

  // Sync demo step with on-chain status
  useEffect(() => {
    if (isDemo && jobStatus !== undefined) {
      demo.syncToJobStatus(jobStatus)
    }
  }, [isDemo, jobStatus, demo.syncToJobStatus])

  // Auto-trigger demo bids at await-bids step
  const bidsTriggered = useRef(false)
  useEffect(() => {
    if (isDemo && demo.currentStep.step === 'await-bids' && jobIdBigInt !== undefined && !bidsTriggered.current) {
      bidsTriggered.current = true
      demo.triggerBids(Number(jobIdBigInt)).then(async (result) => {
        if (result?.signedBids?.length === 0) {
          console.warn('notify-agents returned 0 signed bids:', result)
        }
        // Signed bids appear instantly via state — no need to wait for chain
      })
    }
  }, [isDemo, demo.currentStep.step, jobIdBigInt, demo.triggerBids])

  // Advance to select-provider when bids appear (signed or on-chain)
  useEffect(() => {
    if (isDemo && demo.currentStep.step === 'await-bids' && bids.length > 0) {
      demo.goToNextStep()
    }
  }, [isDemo, demo.currentStep.step, bids.length, demo.goToNextStep])

  // After combined bid+select tx succeeds, refetch data
  useEffect(() => {
    if (signedBidSuccess) {
      refetchJob()
      refetchBidsChain()
    }
  }, [signedBidSuccess, refetchJob, refetchBidsChain])

  // Find selected bid from on-chain bids
  const selectedBid = bids.find(b => b.selected)
  const selectedBidAmount = selectedBid?.amount ?? BigInt(jobBudget)

  // Auto-trigger deliverable after funding (status = 2)
  const deliverableTriggered = useRef(false)
  useEffect(() => {
    if (isDemo && jobStatus === 2 && jobIdBigInt !== undefined && selectedBid && !deliverableTriggered.current) {
      deliverableTriggered.current = true
      const keyIndexMap: Record<string, number> = { MemeSmith: 1, ViralForge: 2, CopySprint: 3 }
      const keyIndex = keyIndexMap[selectedBid.agentName] ?? 1
      demo.triggerDeliverable(Number(jobIdBigInt), selectedBid.agentName, keyIndex)
    }
  }, [isDemo, jobStatus, jobIdBigInt, selectedBid, demo.triggerDeliverable])

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">Job #{jobId}</h1>
          <StatusPill status={statusLabel} />
          {isDemo && (
            <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
              Demo Mode
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span>
            Budget:{' '}
            <span className="font-mono font-semibold text-foreground">
              {formattedBudget} USDC
            </span>
          </span>
          <Separator orientation="vertical" className="h-4" />
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Avalanche Fuji
          </span>
          <Separator orientation="vertical" className="h-4" />
          <span>
            Evaluator:{' '}
            <span className="text-foreground">AI (automated)</span>
          </span>
          {job && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <SnowTraceLinkChip
                address="0x0000000000000000000000000000000000000000"
                label="View on Snowtrace"
              />
            </>
          )}
        </div>
      </div>

      <Separator />

      {/* Two-column layout */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Job Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline jobStatus={jobStatus ?? 0} />
            </CardContent>
          </Card>

          {/* Bids */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Bids{' '}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({bids.length + demo.rejectedBids.length})
                  </span>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <BidsList
                bids={bids}
                rejectedBids={demo.rejectedBids}
                onSelectBid={jobStatus === 0 ? (bidIndex) => {
                  if (jobIdBigInt === undefined) return
                  const bid = bids[bidIndex]
                  if (bid?.signedBid) {
                    // Combined: place signed bid + select provider in one tx
                    const sb = bid.signedBid
                    placeBidWithSignatureAndSelect(
                      BigInt(sb.jobId),
                      BigInt(sb.agentId),
                      BigInt(sb.amount),
                      sb.metadataUri,
                      BigInt(sb.deadline),
                      sb.v,
                      sb.r as `0x${string}`,
                      sb.s as `0x${string}`,
                    )
                  } else {
                    // Already on-chain — use the 1-based bidId from contract
                    selectProvider(jobIdBigInt, BigInt(bid.bidId))
                  }
                } : undefined}
                isClientView={true}
                isSubmittingSignedBid={signedBidPending || signedBidConfirming}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Escrow */}
          <Card>
            <CardHeader>
              <CardTitle>Escrow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusPill status={
                  jobStatus === 4 ? 'Released to Provider'
                  : jobStatus === 5 ? 'Refunded to Client'
                  : jobStatus === 3 ? 'Awaiting Evaluation'
                  : jobStatus !== undefined && jobStatus >= 2 ? 'Funded'
                  : 'Unfunded'
                } />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-mono">
                  {jobStatus !== undefined && jobStatus >= 1 && selectedBid
                    ? `${(Number(selectedBidAmount) / 1e6).toLocaleString()} USDC`
                    : `${formattedBudget} USDC`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Token</span>
                <span>USDC</span>
              </div>
              {jobStatus === 1 && jobIdBigInt !== undefined && (
                <FundEscrowButton jobId={jobIdBigInt} escrowAmount={selectedBidAmount} />
              )}
              {(jobStatus === undefined || jobStatus < 1) && (
                <p className="text-xs text-muted-foreground pt-2">
                  Select a provider before funding the escrow.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Deliverable + Evaluate */}
          {jobStatus !== undefined && jobStatus >= 3 && jobIdBigInt !== undefined && (
            <DeliverableCard
              jobId={jobIdBigInt}
              jobStatus={jobStatus}
              deliverableUri={job?.deliverableUri ?? ''}
              budget={jobBudget}
            />
          )}

          {/* Settlement */}
          {jobStatus !== undefined && (jobStatus === 4 || jobStatus === 5) && (
            <Card>
              <CardHeader>
                <CardTitle>Settlement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Result</span>
                  <StatusPill status={jobStatus === 4 ? 'Approved' : 'Rejected'} />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{jobStatus === 4 ? 'Released' : 'Refunded'}</span>
                  <span className="font-mono">{(Number(selectedBidAmount) / 1e6).toLocaleString()} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rep Change</span>
                  <span className={`font-mono ${jobStatus === 4 ? 'text-green-400' : 'text-red-400'}`}>
                    {jobStatus === 4 ? '+10' : '-15'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selected Provider */}
          <Card>
            <CardHeader>
              <CardTitle>Selected Provider</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {selectedBid ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agent</span>
                    <span>{selectedBid.agentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bid Amount</span>
                    <span className="font-mono">{(Number(selectedBid.amount) / 1e6).toLocaleString()} USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reputation</span>
                    <span className="font-mono">{selectedBid.agentScore}</span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No provider selected yet. Review bids and select a provider to
                  proceed.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Job details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Job ID</span>
                <span className="font-mono">{jobId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network</span>
                <span>Avalanche Fuji</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rep Threshold</span>
                <span className="font-mono">{job ? Number(job.reputationThreshold) : '–'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Evaluator</span>
                <span>AI (automated)</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Demo Runner Panel */}
      {isDemo && (
        <DemoRunnerPanel
          stepNumber={demo.stepNumber}
          totalSteps={demo.totalSteps}
          stepLabel={demo.currentStep.label}
          instruction={demo.currentStep.instruction}
          isProcessing={demo.isProcessing}
          error={demo.error}
        />
      )}
    </div>
  )
}

function DeliverableCard({ jobId, jobStatus, deliverableUri, budget }: { jobId: bigint; jobStatus: number; deliverableUri: string; budget: number }) {
  const { approveDeliverable, isPending: approvePending, isConfirming: approveConfirming, isSuccess: approveSuccess, hash: approveHash } = useApproveDeliverable()
  const { rejectDeliverable, isPending: rejectPending, isConfirming: rejectConfirming, isSuccess: rejectSuccess, hash: rejectHash } = useRejectDeliverable()

  const loading = approvePending || approveConfirming || rejectPending || rejectConfirming
  const resolved = approveSuccess || rejectSuccess
  const txHash = approveHash || rejectHash

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deliverable</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {deliverableUri && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">IPFS</span>
            <a
              href={deliverableUri.startsWith('ipfs://') ? deliverableUri.replace('ipfs://', 'https://ipfs.io/ipfs/') : deliverableUri}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-400 hover:underline truncate max-w-[180px]"
            >
              View Deliverable
            </a>
          </div>
        )}

        {jobStatus === 3 && !resolved && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              className="flex-1"
              disabled={loading}
              onClick={() => approveDeliverable(jobId)}
            >
              {approvePending || approveConfirming ? 'Approving...' : 'Approve'}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="flex-1"
              disabled={loading}
              onClick={() => rejectDeliverable(jobId)}
            >
              {rejectPending || rejectConfirming ? 'Rejecting...' : 'Reject'}
            </Button>
          </div>
        )}

        {resolved && txHash && (
          <div className="pt-2">
            <SnowTraceLinkChip txHash={txHash} label="View Settlement Tx" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function FundEscrowButton({ jobId, escrowAmount }: { jobId: bigint; escrowAmount: bigint }) {
  const { address } = useAccount()
  const { data: balance, refetch: refetchBalance } = useUSDCBalance(address as `0x${string}` | undefined)
  const { approve, isPending: approvePending, isConfirming: approveConfirming, isSuccess: approveSuccess, error: approveError } = useApproveUSDC()
  const { fundJob, isPending: fundPending, isConfirming: fundConfirming, isSuccess: fundSuccess, error: fundError } = useFundJob()
  const { mint, isPending: mintPending, isConfirming: mintConfirming, isSuccess: mintSuccess } = useMintUSDC()
  const hasFunded = useRef(false)

  const usdcBalance = balance !== undefined ? BigInt(balance as string) : BigInt(0)
  const hasEnoughBalance = usdcBalance >= escrowAmount

  // Refetch balance after mint succeeds
  useEffect(() => {
    if (mintSuccess) {
      refetchBalance()
    }
  }, [mintSuccess, refetchBalance])

  // After approve confirms, auto-trigger fundJob — once only
  useEffect(() => {
    if (approveSuccess && !hasFunded.current) {
      hasFunded.current = true
      fundJob(jobId)
    }
  }, [approveSuccess, fundJob, jobId])

  const loading = approvePending || approveConfirming || fundPending || fundConfirming
  const mintLoading = mintPending || mintConfirming
  const txError = approveError || fundError

  const label = fundSuccess
    ? 'Funded!'
    : fundPending || fundConfirming
      ? 'Funding...'
      : approvePending || approveConfirming
        ? 'Approving...'
        : 'Fund Escrow'

  return (
    <div className="space-y-2 pt-2">
      {!hasEnoughBalance && !fundSuccess && (
        <>
          <p className="text-xs text-amber-400">
            Insufficient USDC balance ({(Number(usdcBalance) / 1e6).toLocaleString()} / {(Number(escrowAmount) / 1e6).toLocaleString()} USDC)
          </p>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            disabled={mintLoading}
            onClick={() => address && mint(address as `0x${string}`, escrowAmount)}
          >
            {mintLoading ? 'Minting...' : 'Mint USDC'}
          </Button>
        </>
      )}
      <Button
        size="sm"
        className="w-full"
        disabled={loading || !address || fundSuccess || !hasEnoughBalance}
        onClick={() => approve(CONTRACT_ADDRESSES.jobManager, escrowAmount)}
      >
        {label}
      </Button>
      {txError && (
        <p className="text-xs text-red-400">
          {txError.message?.includes('User rejected') ? 'Transaction rejected' : 'Transaction failed — please try again'}
        </p>
      )}
    </div>
  )
}

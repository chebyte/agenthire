'use client'

import { useState, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { JobCard } from '@/components/jobs/job-card'
import { JobCardSkeleton } from '@/components/jobs/job-card-skeleton'
import { useJobs } from '@/hooks/use-jobs'
import { JobStatus } from '@/types/job'

const CATEGORIES = ['All', 'Meme Creation', 'Copywriting', 'Content Writing', 'Design'] as const

export default function JobsPage() {
  const { address, isConnected } = useAccount()
  const { jobs, isLoading } = useJobs()

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('All')

  // Derive filtered lists
  const openJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (job.status !== JobStatus.Open) return false
      if (category !== 'All' && job.metadata?.category !== category) return false
      if (search) {
        const q = search.toLowerCase()
        const title = (job.metadata?.title || '').toLowerCase()
        const desc = (job.metadata?.description || '').toLowerCase()
        if (!title.includes(q) && !desc.includes(q)) return false
      }
      return true
    })
  }, [jobs, category, search])

  const myJobs = useMemo(() => {
    if (!address) return []
    return jobs.filter((job) => {
      if (job.client.toLowerCase() !== address.toLowerCase()) return false
      if (category !== 'All' && job.metadata?.category !== category) return false
      if (search) {
        const q = search.toLowerCase()
        const title = (job.metadata?.title || '').toLowerCase()
        const desc = (job.metadata?.description || '').toLowerCase()
        if (!title.includes(q) && !desc.includes(q)) return false
      }
      return true
    })
  }, [jobs, address, category, search])

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Explore Jobs</h1>
        <p className="mt-2 text-muted-foreground">
          Browse open jobs and find work for your AI agents.
        </p>
      </div>

      <Tabs defaultValue="open">
        <TabsList className="mb-6">
          <TabsTrigger value="open">Open Jobs</TabsTrigger>
          {isConnected && <TabsTrigger value="my">My Jobs</TabsTrigger>}
        </TabsList>

        {/* Filter bar */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row">
          <Select value={category} onValueChange={(v) => setCategory(v ?? 'All')}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:flex-1"
          />
        </div>

        {/* Open Jobs Tab */}
        <TabsContent value="open">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <JobCardSkeleton key={i} />
              ))}
            </div>
          ) : openJobs.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.08 } },
              }}
            >
              {openJobs.map((job) => (
                <motion.div
                  key={job.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                  <JobCard job={job} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {search || category !== 'All'
                  ? 'No jobs match your filters.'
                  : 'No open jobs yet. Be the first to create one!'}
              </p>
            </div>
          )}
        </TabsContent>

        {/* My Jobs Tab */}
        {isConnected && (
          <TabsContent value="my">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <JobCardSkeleton key={i} />
                ))}
              </div>
            ) : myJobs.length > 0 ? (
              <motion.div
                className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.08 } },
                }}
              >
                {myJobs.map((job) => (
                  <motion.div
                    key={job.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  >
                    <JobCard job={job} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {search || category !== 'All'
                    ? 'No jobs match your filters.'
                    : "You haven't created any jobs yet."}
                </p>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Wallet connect banner */}
      {!isConnected && (
        <div className="mt-8 rounded-lg border border-border/50 bg-muted/30 px-4 py-3 text-center text-sm text-muted-foreground">
          Connect your wallet to see jobs you&apos;ve created.
        </div>
      )}
    </div>
  )
}

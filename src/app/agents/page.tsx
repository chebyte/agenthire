'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AgentCard } from '@/components/agents/agent-card'
import { DEMO_AGENTS } from '@/lib/data/demo-agents'

const CATEGORIES = ['All', 'Meme Creation', 'Copywriting'] as const

export default function AgentsPage() {
  const [category, setCategory] = useState<string>('All')
  const [minReputation, setMinReputation] = useState<string>('')
  const [search, setSearch] = useState('')

  const filtered = DEMO_AGENTS.filter((agent) => {
    const meta = agent.metadata
    if (!meta) return false

    // Category filter
    if (category !== 'All' && meta.specialty !== category) return false

    // Min reputation filter
    const minRep = parseInt(minReputation, 10)
    if (!isNaN(minRep) && agent.reputationScore < minRep) return false

    // Search filter
    if (search) {
      const q = search.toLowerCase()
      const matchesName = meta.name.toLowerCase().includes(q)
      const matchesDesc = meta.description.toLowerCase().includes(q)
      const matchesTags = meta.tags.some((t) => t.toLowerCase().includes(q))
      if (!matchesName && !matchesDesc && !matchesTags) return false
    }

    return true
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Choose from verified AI agents
        </h1>
        <p className="mt-2 text-muted-foreground">
          Browse reputation, compare bids, and hire with confidence.
        </p>
      </div>

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
          type="number"
          placeholder="Min reputation"
          value={minReputation}
          onChange={(e) => setMinReputation(e.target.value)}
          className="w-full sm:w-[160px]"
        />

        <Input
          type="text"
          placeholder="Search agents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:flex-1"
        />
      </div>

      {/* Agent grid */}
      {filtered.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08 } },
          }}
        >
          {filtered.map((agent) => (
            <motion.div
              key={agent.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <AgentCard agent={agent} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="col-span-full text-center py-12">
          <p className="text-muted-foreground">No agents match your filters.</p>
        </div>
      )}
    </div>
  )
}

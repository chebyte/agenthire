import type { AgentMetadata } from '@/types/agent'

export interface BidDecision {
  shouldBid: boolean
  amount: number
  reason: string
}

const BID_FACTORS: Record<number, number> = {
  0: 0.55,
  1: 0.65,
  2: 0.75,
  3: 0.85,
}

export function evaluateJob(
  agent: AgentMetadata,
  agentIndex: number,
  jobMeta: { category: string; title: string; description: string },
  budget: number,
): BidDecision {
  const specialty = (agent.specialty || '').toLowerCase()
  const tags = (agent.tags || []).map((t) => t.toLowerCase())
  const jobCategory = jobMeta.category.toLowerCase()
  const jobTitle = jobMeta.title.toLowerCase()
  const jobDescription = jobMeta.description.toLowerCase()

  // Word-level matching: split specialty & tags into individual words,
  // then check if any word (3+ chars) appears in category/title/description
  const toWords = (s: string) =>
    s.split(/[\s&,\-_/]+/).filter((w) => w.length >= 3)

  const specialtyWords = toWords(specialty)
  const tagWords = tags.flatMap((t) => toWords(t))
  const allWords = [...specialtyWords, ...tagWords]
  const corpus = `${jobCategory} ${jobTitle} ${jobDescription}`

  const matchesCategory =
    specialty.includes(jobCategory) ||
    jobCategory.includes(specialty) ||
    allWords.some((word) => corpus.includes(word))

  if (!matchesCategory) {
    return {
      shouldBid: false,
      amount: 0,
      reason: `Agent specialty "${agent.specialty}" does not match job category "${jobMeta.category}"`,
    }
  }

  const factor = BID_FACTORS[agentIndex % 4] ?? 0.65
  const bidAmount = Math.round(budget * factor)

  return {
    shouldBid: true,
    amount: bidAmount,
    reason: `Matched on specialty/tags. Bidding ${bidAmount} USDC (${(factor * 100).toFixed(0)}% of budget)`,
  }
}

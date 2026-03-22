'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SnowTraceLinkChip } from '@/components/shared/snowtrace-link-chip'
import { useRegisterAgent } from '@/hooks/use-agent-registry'
import { SkillFormBlock, emptySkill } from './skill-form-block'
import type { SkillFormData } from './skill-form-block'
import type { AgentMetadata } from '@/types'

type FormStatus = 'idle' | 'uploading' | 'registering' | 'success' | 'error'

export function RegisterAgentForm() {
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('')
  const [description, setDescription] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [tags, setTags] = useState('')
  const [endpointUrl, setEndpointUrl] = useState('')
  const [skills, setSkills] = useState<SkillFormData[]>([{ ...emptySkill }])
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const {
    registerAgent,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error: txError,
  } = useRegisterAgent()

  const updateSkill = (index: number, data: SkillFormData) => {
    setSkills((prev) => prev.map((s, i) => (i === index ? data : s)))
  }

  const removeSkill = (index: number) => {
    setSkills((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  const addSkill = () => {
    setSkills((prev) => [...prev, { ...emptySkill }])
  }

  const buildMetadata = (): AgentMetadata => ({
    name,
    avatar,
    description,
    specialty,
    tags: tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    endpointUrl,
    evaluatorMode: 'client-manual',
    skills: skills.map((s) => ({
      name: s.name,
      description: s.description,
      inputSchema: JSON.parse(s.inputSchema || '{}'),
      outputSchema: JSON.parse(s.outputSchema || '{}'),
      pricingModel: s.pricingModel,
      sla: s.sla,
    })),
    stats: {
      successRate: 0,
      avgBid: 0,
      completedJobs: 0,
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    // Validate JSON schemas
    for (const skill of skills) {
      try {
        JSON.parse(skill.inputSchema || '{}')
        JSON.parse(skill.outputSchema || '{}')
      } catch {
        setStatus('error')
        setErrorMessage('One or more skill schemas contain invalid JSON.')
        return
      }
    }

    try {
      // Step 1: Upload metadata to IPFS
      setStatus('uploading')
      const metadata = buildMetadata()
      const response = await fetch('/api/ipfs/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: metadata, name: `agent-${name}` }),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`IPFS upload failed: ${text}`)
      }

      const { uri } = await response.json()

      // Step 2: Register onchain
      setStatus('registering')
      registerAgent(uri)
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  // Derive final status from tx state
  const derivedStatus = (() => {
    if (isSuccess) return 'success' as const
    if (txError) return 'error' as const
    if (isConfirming || isPending) return 'registering' as const
    return status
  })()

  const derivedError =
    txError?.message || errorMessage || ''

  const isSubmitting = derivedStatus === 'uploading' || derivedStatus === 'registering'

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Agent details */}
      <Card>
        <CardHeader>
          <CardTitle>Agent details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent-name">Name</Label>
            <Input
              id="agent-name"
              placeholder="My AI Agent"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-avatar">Avatar URL</Label>
            <Input
              id="agent-avatar"
              placeholder="https://example.com/avatar.png"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-description">Description</Label>
            <Textarea
              id="agent-description"
              placeholder="Describe what your agent does..."
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-specialty">Specialty</Label>
            <Input
              id="agent-specialty"
              placeholder="e.g. Smart Contract Auditing"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-tags">Tags (comma-separated)</Label>
            <Input
              id="agent-tags"
              placeholder="solidity, audit, security"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-endpoint">Endpoint URL</Label>
            <Input
              id="agent-endpoint"
              placeholder="https://api.myagent.com/execute"
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Skills</h2>
        {skills.map((skill, i) => (
          <SkillFormBlock
            key={i}
            index={i}
            value={skill}
            onChange={updateSkill}
            onRemove={removeSkill}
          />
        ))}
        <Button type="button" variant="outline" onClick={addSkill}>
          Add another skill
        </Button>
      </div>

      {/* Error */}
      {derivedStatus === 'error' && derivedError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{derivedError}</p>
        </div>
      )}

      {/* Success */}
      {derivedStatus === 'success' && (
        <div className="rounded-md border border-green-500/50 bg-green-500/10 p-4 space-y-3">
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            Agent registered successfully!
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/agents"
              className="text-sm underline underline-offset-4 hover:text-foreground"
            >
              View agent listing
            </Link>
            {hash && <SnowTraceLinkChip txHash={hash} label="View on Snowtrace" />}
          </div>
        </div>
      )}

      {/* Submit */}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {derivedStatus === 'uploading'
          ? 'Uploading to IPFS...'
          : derivedStatus === 'registering'
            ? 'Registering onchain...'
            : 'Register on Avalanche Fuji'}
      </Button>
    </form>
  )
}

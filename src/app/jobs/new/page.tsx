'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { JobForm } from '@/components/jobs/job-form'
import { JobPreviewCard } from '@/components/jobs/job-preview-card'

export default function CreateJobPage() {
  const searchParams = useSearchParams()
  const isDemo = searchParams.get('demo') === 'true'

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    budget: '',
    reputationThreshold: '60',
  })

  return (
    <div className="container mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create a new job</h1>
        <p className="mt-2 text-muted-foreground">
          Open a task, receive bids, and settle it on Avalanche Fuji.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <JobForm formData={formData} setFormData={setFormData} isDemo={isDemo} />
        </div>
        <div>
          <JobPreviewCard formData={formData} />
        </div>
      </div>
    </div>
  )
}

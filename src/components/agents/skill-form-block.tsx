'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X } from 'lucide-react'

export interface SkillFormData {
  name: string
  description: string
  inputSchema: string
  outputSchema: string
  pricingModel: string
  sla: string
}

export const emptySkill: SkillFormData = {
  name: '',
  description: '',
  inputSchema: '{}',
  outputSchema: '{}',
  pricingModel: 'fixed',
  sla: '',
}

interface SkillFormBlockProps {
  index: number
  value: SkillFormData
  onChange: (index: number, data: SkillFormData) => void
  onRemove: (index: number) => void
}

function validateJSON(str: string): string | null {
  try {
    JSON.parse(str)
    return null
  } catch {
    return 'Invalid JSON'
  }
}

export function SkillFormBlock({ index, value, onChange, onRemove }: SkillFormBlockProps) {
  const [inputSchemaError, setInputSchemaError] = useState<string | null>(null)
  const [outputSchemaError, setOutputSchemaError] = useState<string | null>(null)

  const update = (field: keyof SkillFormData, val: string) => {
    onChange(index, { ...value, [field]: val })
  }

  const handleInputSchemaChange = (val: string) => {
    setInputSchemaError(validateJSON(val))
    update('inputSchema', val)
  }

  const handleOutputSchemaChange = (val: string) => {
    setOutputSchemaError(validateJSON(val))
    update('outputSchema', val)
  }

  return (
    <Card>
      <CardContent className="relative pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Skill {index + 1}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove skill</span>
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`skill-name-${index}`}>Skill name</Label>
          <Input
            id={`skill-name-${index}`}
            placeholder="e.g. Code Review"
            value={value.name}
            onChange={(e) => update('name', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`skill-desc-${index}`}>Description</Label>
          <Textarea
            id={`skill-desc-${index}`}
            placeholder="What does this skill do?"
            value={value.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`skill-input-${index}`}>Input schema (JSON)</Label>
          <Textarea
            id={`skill-input-${index}`}
            className="font-mono text-xs"
            placeholder="{}"
            value={value.inputSchema}
            onChange={(e) => handleInputSchemaChange(e.target.value)}
          />
          {inputSchemaError && (
            <p className="text-xs text-destructive">{inputSchemaError}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`skill-output-${index}`}>Output schema (JSON)</Label>
          <Textarea
            id={`skill-output-${index}`}
            className="font-mono text-xs"
            placeholder="{}"
            value={value.outputSchema}
            onChange={(e) => handleOutputSchemaChange(e.target.value)}
          />
          {outputSchemaError && (
            <p className="text-xs text-destructive">{outputSchemaError}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Pricing model</Label>
          <Select
            value={value.pricingModel}
            onValueChange={(v) => update('pricingModel', v ?? 'fixed')}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select pricing model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Fixed</SelectItem>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="per-token">Per-token</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`skill-sla-${index}`}>SLA</Label>
          <Input
            id={`skill-sla-${index}`}
            placeholder="e.g. 24h turnaround"
            value={value.sla}
            onChange={(e) => update('sla', e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  )
}

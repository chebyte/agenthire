import { DeliverableStrategy, StructuredJobInput, StandardDeliverable } from '../types'

export class DeterministicMemeStrategy implements DeliverableStrategy {
  private agentName: string

  constructor(agentName: string) {
    this.agentName = agentName
  }

  canHandle(job: StructuredJobInput): boolean {
    return job.category.toLowerCase().includes('meme')
  }

  async produce(job: StructuredJobInput): Promise<StandardDeliverable> {
    return {
      title: `${job.category} Deliverable`,
      content: {
        prompt: job.prompt,
        meme_text_top: 'when your agent actually ships',
        meme_text_bottom: 'and the judges realize it settled onchain',
        caption: 'Agent commerce just got real.',
        image_prompt: 'cyberpunk hackathon stage, AI agent holding trophy, meme style',
      },
      metadata: {
        createdBy: this.agentName,
        timestamp: new Date().toISOString(),
        category: job.category,
      },
    }
  }
}

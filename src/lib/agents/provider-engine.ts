import { DeliverableStrategy, StructuredJobInput, StandardDeliverable } from './types'

export class ProviderEngine {
  private strategies: DeliverableStrategy[]

  constructor(strategies: DeliverableStrategy[]) {
    this.strategies = strategies
  }

  async produce(job: StructuredJobInput): Promise<StandardDeliverable> {
    const strategy = this.strategies.find((s) => s.canHandle(job))
    if (!strategy) {
      throw new Error(`No strategy can handle job category: ${job.category}`)
    }
    return strategy.produce(job)
  }
}

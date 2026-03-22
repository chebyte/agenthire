import { RegisterAgentForm } from '@/components/agents/register-agent-form'

export default function RegisterAgentPage() {
  return (
    <div className="container mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Register your agent</h1>
        <p className="mt-2 text-muted-foreground">
          Create an onchain identity on Avalanche Fuji
        </p>
      </div>
      <RegisterAgentForm />
    </div>
  )
}

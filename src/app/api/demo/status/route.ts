import { NextResponse } from 'next/server'

export async function GET() {
  const configured = !!(
    process.env.DEMO_AGENT_PRIVATE_KEY_1 &&
    process.env.DEMO_AGENT_PRIVATE_KEY_2
  )
  return NextResponse.json({ configured })
}

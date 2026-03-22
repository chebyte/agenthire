import { NextResponse } from 'next/server'
import { uploadJSONWithRetry } from '@/lib/ipfs/pinata'

export async function POST(request: Request) {
  const { data, name } = await request.json()
  const uri = await uploadJSONWithRetry(data, name)
  return NextResponse.json({ uri })
}

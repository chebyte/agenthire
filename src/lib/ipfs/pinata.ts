const PINATA_API = 'https://api.pinata.cloud'

export async function uploadJSON(data: Record<string, unknown>, name: string): Promise<string> {
  const jwt = process.env.PINATA_JWT
  if (!jwt) throw new Error('PINATA_JWT not configured')

  const response = await fetch(`${PINATA_API}/pinning/pinJSONToIPFS`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({
      pinataContent: data,
      pinataMetadata: { name },
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Pinata upload failed: ${response.status} ${text}`)
  }

  const result = await response.json()
  return `ipfs://${result.IpfsHash}`
}

export async function uploadJSONWithRetry(
  data: Record<string, unknown>,
  name: string,
  retries = 3,
): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      return await uploadJSON(data, name)
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
    }
  }
  throw new Error('Upload failed after retries')
}

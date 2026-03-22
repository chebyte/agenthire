const GATEWAY_URL = 'https://gateway.pinata.cloud/ipfs'

export function ipfsToGatewayUrl(ipfsUri: string): string {
  if (!ipfsUri) return ''
  const cid = ipfsUri.replace('ipfs://', '')
  return `${GATEWAY_URL}/${cid}`
}

export async function fetchFromIPFS<T>(ipfsUri: string): Promise<T> {
  const url = ipfsToGatewayUrl(ipfsUri)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`IPFS fetch failed: ${response.status}`)
  }
  return response.json() as Promise<T>
}

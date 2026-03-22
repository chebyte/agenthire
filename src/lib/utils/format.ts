export function shortenAddress(address: string, chars = 4): string {
  if (!address) return ''
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

export function formatUSDC(amount: bigint): string {
  const num = Number(amount) / 1e6
  return `${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} USDC`
}

export function parseUSDC(amount: number): bigint {
  return BigInt(Math.round(amount * 1e6))
}

export function snowtraceTxUrl(txHash: string): string {
  return `https://testnet.snowtrace.io/tx/${txHash}`
}

export function snowtraceAddressUrl(address: string): string {
  return `https://testnet.snowtrace.io/address/${address}`
}

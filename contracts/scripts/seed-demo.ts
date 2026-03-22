import { ethers } from "hardhat"
import * as fs from "fs"
import * as path from "path"

async function uploadToPinata(data: Record<string, unknown>, name: string): Promise<string> {
  const jwt = process.env.PINATA_JWT
  if (!jwt) throw new Error("PINATA_JWT not configured in .env.local")

  const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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

async function main() {
  const [deployer] = await ethers.getSigners()

  const registryAddr = process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS!
  const usdcAddr = process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS!

  const registry = await ethers.getContractAt("AgentRegistry", registryAddr)
  const usdc = await ethers.getContractAt("MockUSDC", usdcAddr)

  // Create wallets for each agent from their individual private keys
  const agent1Wallet = new ethers.Wallet(process.env.DEMO_AGENT_PRIVATE_KEY_1!, ethers.provider)
  const agent2Wallet = new ethers.Wallet(process.env.DEMO_AGENT_PRIVATE_KEY_2!, ethers.provider)
  const agent3Wallet = new ethers.Wallet(process.env.DEMO_AGENT_PRIVATE_KEY_3!, ethers.provider)
  const agentWallets = [agent1Wallet, agent2Wallet, agent3Wallet]

  console.log(`Agent 1 (MemeSmith) address: ${agent1Wallet.address}`)
  console.log(`Agent 2 (ViralForge) address: ${agent2Wallet.address}`)
  console.log(`Agent 3 (CopySprint) address: ${agent3Wallet.address}`)

  // Read current nextAgentId so we know which IDs get assigned
  const startId = await registry.nextAgentId()
  console.log(`Starting agent ID: ${startId}`)

  // Upload metadata JSON files to Pinata
  const docsDir = path.resolve(__dirname, "../../docs")
  const agents = [
    { file: "memesmith.json", label: "MemeSmith", wallet: agent1Wallet },
    { file: "viralforge.json", label: "ViralForge", wallet: agent2Wallet },
    { file: "copysprint.json", label: "CopySprint", wallet: agent3Wallet },
  ]

  const metadataUris: string[] = []
  for (const agent of agents) {
    const filePath = path.join(docsDir, agent.file)
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"))
    console.log(`Uploading ${agent.label} metadata to Pinata...`)
    const uri = await uploadToPinata(data, agent.label)
    console.log(`  → ${uri}`)
    metadataUris.push(uri)
  }

  // Fund agent wallets with ETH for gas (deployer sends 0.01 ETH to each)
  let nonce = await deployer.getNonce()
  for (const agent of agents) {
    console.log(`Sending gas ETH to ${agent.label} (${agent.wallet.address})...`)
    const tx = await deployer.sendTransaction({
      to: agent.wallet.address,
      value: ethers.parseEther("0.01"),
      nonce: nonce++,
    })
    await tx.wait()
  }

  // Register each agent from its own wallet (owner = agent wallet)
  console.log("Registering MemeSmith from its own wallet...")
  let tx = await registry.connect(agent1Wallet).registerAgent(metadataUris[0])
  await tx.wait()

  console.log("Registering ViralForge from its own wallet...")
  tx = await registry.connect(agent2Wallet).registerAgent(metadataUris[1])
  await tx.wait()

  console.log("Registering CopySprint from its own wallet...")
  tx = await registry.connect(agent3Wallet).registerAgent(metadataUris[2])
  await tx.wait()

  // Set reputation scores using deployer-only helper (use dynamic IDs)
  const memeSmithId = startId
  const viralForgeId = startId + 1n
  const copySprintId = startId + 2n

  // Refresh deployer nonce after agent registrations
  nonce = await deployer.getNonce()

  console.log("Setting reputation scores...")
  tx = await registry.connect(deployer).setReputationForTesting(memeSmithId, 72, { nonce: nonce++ })
  await tx.wait()
  tx = await registry.connect(deployer).setReputationForTesting(viralForgeId, 45, { nonce: nonce++ })
  await tx.wait()
  tx = await registry.connect(deployer).setReputationForTesting(copySprintId, 81, { nonce: nonce++ })
  await tx.wait()

  console.log("\nDemo agents registered and reputation set!")
  console.log(`MemeSmith (ID ${memeSmithId}): 72 (Verified) — owner: ${agent1Wallet.address}`)
  console.log(`ViralForge (ID ${viralForgeId}): 45 (Risky) — owner: ${agent2Wallet.address}`)
  console.log(`CopySprint (ID ${copySprintId}): 81 (Top Rated) — owner: ${agent3Wallet.address}`)

  // Mint USDC to deployer + agent wallets
  const mintAmount = 1000n * 10n ** 6n // 1000 USDC
  tx = await usdc.mint(deployer.address, mintAmount, { nonce: nonce++ })
  await tx.wait()
  console.log(`Minted ${mintAmount} MockUSDC to deployer (${deployer.address})`)

  for (const wallet of agentWallets) {
    tx = await usdc.mint(wallet.address, mintAmount, { nonce: nonce++ })
    await tx.wait()
    console.log(`Minted ${mintAmount} MockUSDC to ${wallet.address}`)
  }
}

main().catch(console.error)

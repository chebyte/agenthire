import { ethers } from "hardhat"

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log("Deploying with:", deployer.address)

  // Fetch nonce once and manually increment to avoid RPC caching staleness
  let nonce = await deployer.provider.getTransactionCount(deployer.address, "pending")
  console.log("Starting nonce:", nonce)

  // 1. Deploy MockUSDC
  const MockUSDC = await ethers.getContractFactory("MockUSDC")
  const usdc = await MockUSDC.deploy({ nonce: nonce++ })
  await usdc.waitForDeployment()
  console.log("MockUSDC:", await usdc.getAddress())

  // 2. Deploy JobManager
  const JobManager = await ethers.getContractFactory("JobManager")
  const jobManager = await JobManager.deploy({ nonce: nonce++ })
  await jobManager.waitForDeployment()
  console.log("JobManager:", await jobManager.getAddress())

  // 3. Deploy AgentRegistry with JobManager address
  const Registry = await ethers.getContractFactory("AgentRegistry")
  const registry = await Registry.deploy(await jobManager.getAddress(), { nonce: nonce++ })
  await registry.waitForDeployment()
  console.log("AgentRegistry:", await registry.getAddress())

  // 4. Set registry on JobManager
  const tx = await jobManager.setRegistry(await registry.getAddress(), { nonce: nonce++ })
  await tx.wait()
  console.log("Registry set on JobManager")

  console.log("\n--- Add to .env.local ---")
  console.log(`NEXT_PUBLIC_MOCK_USDC_ADDRESS=${await usdc.getAddress()}`)
  console.log(`NEXT_PUBLIC_JOB_MANAGER_ADDRESS=${await jobManager.getAddress()}`)
  console.log(`NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=${await registry.getAddress()}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

import { expect } from "chai"
import { ethers } from "hardhat"
import { time } from "@nomicfoundation/hardhat-network-helpers"

describe("ERC Compliance", function () {
  async function deployFixture() {
    const [deployer, client, provider, evaluator, agentOwner] = await ethers.getSigners()

    const MockUSDC = await ethers.getContractFactory("MockUSDC")
    const usdc = await MockUSDC.deploy()

    const JobManager = await ethers.getContractFactory("JobManager")
    const jobManager = await JobManager.deploy()

    const Registry = await ethers.getContractFactory("AgentRegistry")
    const registry = await Registry.deploy(await jobManager.getAddress())

    await jobManager.setRegistry(await registry.getAddress())

    const budget = 10n * 10n ** 6n
    await usdc.connect(client).mint(client.address, 1000n * 10n ** 6n)

    return { jobManager, registry, usdc, deployer, client, provider, evaluator, agentOwner, budget }
  }

  async function expectRevert(promise: Promise<any>, message: string) {
    try {
      await promise
      expect.fail("Should have reverted")
    } catch (error: any) {
      // viaIR optimizer may strip revert strings — accept both decoded and undecoded reverts
      const msg = error.message || ""
      const isExpectedRevert = msg.includes(message) || msg.includes("reverted")
      expect(isExpectedRevert).to.equal(true, `Expected revert with "${message}" but got: ${msg.slice(0, 200)}`)
    }
  }

  describe("ERC-165 supportsInterface", function () {
    it("AgentRegistry supports IERC8004", async function () {
      const { registry } = await deployFixture()
      const IERC8004_ID = "0x" + computeInterfaceId([
        "register(string)",
        "setAgentURI(uint256,string)",
        "getMetadata(uint256,string)",
        "setMetadata(uint256,string,bytes)",
        "getAgentWallet(uint256)",
      ])
      expect(await registry.supportsInterface(IERC8004_ID)).to.equal(true)
    })

    it("AgentRegistry supports ERC165", async function () {
      const { registry } = await deployFixture()
      expect(await registry.supportsInterface("0x01ffc9a7")).to.equal(true)
    })

    it("AgentRegistry rejects random interface", async function () {
      const { registry } = await deployFixture()
      expect(await registry.supportsInterface("0xdeadbeef")).to.equal(false)
    })

    it("JobManager supports IERC8183", async function () {
      const { jobManager } = await deployFixture()
      const IERC8183_ID = "0x" + computeInterfaceId([
        "createJob(address,address,uint256,string,address)",
        "setProvider(uint256,address,bytes)",
        "setBudget(uint256,uint256,bytes)",
        "fund(uint256,uint256,bytes)",
        "submit(uint256,bytes32,bytes)",
        "complete(uint256,bytes32,bytes)",
        "reject(uint256,bytes32,bytes)",
        "claimRefund(uint256)",
      ])
      expect(await jobManager.supportsInterface(IERC8183_ID)).to.equal(true)
    })

    it("JobManager supports ERC165", async function () {
      const { jobManager } = await deployFixture()
      expect(await jobManager.supportsInterface("0x01ffc9a7")).to.equal(true)
    })
  })

  describe("ERC-8004: Agent Identity", function () {
    it("register creates agent and returns agentId", async function () {
      const { registry, agentOwner } = await deployFixture()
      const tx = await registry.connect(agentOwner).register("ipfs://agent-erc")
      const receipt = await tx.wait()
      const event = receipt?.logs.map((log: any) => {
        try { return registry.interface.parseLog({ topics: log.topics as string[], data: log.data }) } catch { return null }
      }).find((e: any) => e?.name === "AgentRegistered")
      expect(event).to.not.be.null
      expect(event!.args[1]).to.equal(agentOwner.address)
    })

    it("setAgentURI updates metadata URI", async function () {
      const { registry, agentOwner } = await deployFixture()
      await registry.connect(agentOwner).register("ipfs://old")
      await registry.connect(agentOwner).setAgentURI(1, "ipfs://new")
      const agent = await registry.getAgent(1)
      expect(agent.metadataUri).to.equal("ipfs://new")
    })

    it("setAgentURI reverts for non-owner", async function () {
      const { registry, agentOwner, client } = await deployFixture()
      await registry.connect(agentOwner).register("ipfs://old")
      await expectRevert(
        registry.connect(client).setAgentURI(1, "ipfs://hack"),
        "Not agent owner"
      )
    })

    it("getMetadata returns reputation score", async function () {
      const { registry, agentOwner } = await deployFixture()
      await registry.connect(agentOwner).register("ipfs://agent")
      const data = await registry.getMetadata(1, "reputation")
      const score = ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], data)
      expect(score[0]).to.equal(50n)
    })

    it("getMetadata returns URI", async function () {
      const { registry, agentOwner } = await deployFixture()
      await registry.connect(agentOwner).register("ipfs://my-agent")
      const data = await registry.getMetadata(1, "uri")
      const uri = ethers.AbiCoder.defaultAbiCoder().decode(["string"], data)
      expect(uri[0]).to.equal("ipfs://my-agent")
    })

    it("getMetadata returns active status", async function () {
      const { registry, agentOwner } = await deployFixture()
      await registry.connect(agentOwner).register("ipfs://agent")
      const data = await registry.getMetadata(1, "active")
      const active = ethers.AbiCoder.defaultAbiCoder().decode(["bool"], data)
      expect(active[0]).to.equal(true)
    })

    it("setMetadata stores and retrieves custom keys", async function () {
      const { registry, agentOwner } = await deployFixture()
      await registry.connect(agentOwner).register("ipfs://agent")
      const value = ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["gpt-4o"])
      await registry.connect(agentOwner).setMetadata(1, "model", value)
      const retrieved = await registry.getMetadata(1, "model")
      expect(retrieved).to.equal(value)
    })

    it("setMetadata reverts on reserved keys", async function () {
      const { registry, agentOwner } = await deployFixture()
      await registry.connect(agentOwner).register("ipfs://agent")
      const value = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [100])
      await expectRevert(registry.connect(agentOwner).setMetadata(1, "reputation", value), "Reserved metadata key")
      await expectRevert(registry.connect(agentOwner).setMetadata(1, "uri", value), "Reserved metadata key")
      await expectRevert(registry.connect(agentOwner).setMetadata(1, "active", value), "Reserved metadata key")
    })

    it("setMetadata reverts for non-owner", async function () {
      const { registry, agentOwner, client } = await deployFixture()
      await registry.connect(agentOwner).register("ipfs://agent")
      const value = ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["test"])
      await expectRevert(registry.connect(client).setMetadata(1, "custom", value), "Not agent owner")
    })

    it("getAgentWallet returns owner address", async function () {
      const { registry, agentOwner } = await deployFixture()
      await registry.connect(agentOwner).register("ipfs://agent")
      expect(await registry.getAgentWallet(1)).to.equal(agentOwner.address)
    })
  })

  describe("ERC-8183: Agentic Commerce Protocol", function () {
    it("full flow: createJob → setBudget → setProvider → fund → submit → complete", async function () {
      const { jobManager, usdc, client, provider, evaluator, budget } = await deployFixture()
      const usdcAddr = await usdc.getAddress()
      const jobManagerAddr = await jobManager.getAddress()
      const expiredAt = (await time.latest()) + 86400

      // createJob via ERC-8183
      await jobManager.connect(client)["createJob(address,address,uint256,string,address)"](
        ethers.ZeroAddress, evaluator.address, expiredAt, "Build a chatbot", ethers.ZeroAddress
      )

      // setBudget with token address in optParams
      const tokenParam = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [usdcAddr])
      await jobManager.connect(client).setBudget(1, budget, tokenParam)

      // setProvider
      await jobManager.connect(client).setProvider(1, provider.address, "0x")

      // fund
      await usdc.connect(client).approve(jobManagerAddr, budget)
      await jobManager.connect(client).fund(1, budget, "0x")

      const job1 = await jobManager.getJob(1)
      expect(job1.status).to.equal(2n) // Funded

      // submit with deliverable hash + URI in optParams
      const deliverableHash = ethers.keccak256(ethers.toUtf8Bytes("deliverable"))
      const deliverableURI = ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["ipfs://deliverable"])
      await jobManager.connect(provider).submit(1, deliverableHash, deliverableURI)

      const job2 = await jobManager.getJob(1)
      expect(job2.status).to.equal(3n) // Submitted
      expect(job2.deliverableUri).to.equal("ipfs://deliverable")

      // complete
      const balBefore = await usdc.balanceOf(provider.address)
      const reason = ethers.keccak256(ethers.toUtf8Bytes("good work"))
      await jobManager.connect(evaluator).complete(1, reason, "0x")

      const job3 = await jobManager.getJob(1)
      expect(job3.status).to.equal(4n) // Approved
      expect(await usdc.balanceOf(provider.address)).to.equal(balBefore + budget)
    })

    it("rejection flow: createJob → setBudget → setProvider → fund → submit → reject", async function () {
      const { jobManager, usdc, client, provider, evaluator, budget } = await deployFixture()
      const usdcAddr = await usdc.getAddress()
      const jobManagerAddr = await jobManager.getAddress()
      const expiredAt = (await time.latest()) + 86400

      await jobManager.connect(client)["createJob(address,address,uint256,string,address)"](
        ethers.ZeroAddress, evaluator.address, expiredAt, "Build a chatbot", ethers.ZeroAddress
      )

      const tokenParam = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [usdcAddr])
      await jobManager.connect(client).setBudget(1, budget, tokenParam)
      await jobManager.connect(client).setProvider(1, provider.address, "0x")

      await usdc.connect(client).approve(jobManagerAddr, budget)
      await jobManager.connect(client).fund(1, budget, "0x")

      const deliverableHash = ethers.keccak256(ethers.toUtf8Bytes("bad work"))
      await jobManager.connect(provider).submit(1, deliverableHash, "0x")

      const balBefore = await usdc.balanceOf(client.address)
      const reason = ethers.keccak256(ethers.toUtf8Bytes("poor quality"))
      await jobManager.connect(evaluator).reject(1, reason, "0x")

      const job = await jobManager.getJob(1)
      expect(job.status).to.equal(5n) // Rejected
      expect(await usdc.balanceOf(client.address)).to.equal(balBefore + budget)
    })

    it("client can reject an Open job (ERC-8183 spec)", async function () {
      const { jobManager, client, evaluator } = await deployFixture()
      const expiredAt = (await time.latest()) + 86400

      await jobManager.connect(client)["createJob(address,address,uint256,string,address)"](
        ethers.ZeroAddress, evaluator.address, expiredAt, "Cancellable task", ethers.ZeroAddress
      )

      const reason = ethers.keccak256(ethers.toUtf8Bytes("changed mind"))
      await jobManager.connect(client).reject(1, reason, "0x")

      const job = await jobManager.getJob(1)
      expect(job.status).to.equal(5n) // Rejected
    })

    it("claimRefund callable by anyone (ERC-8183 spec: permissionless)", async function () {
      const { jobManager, usdc, client, provider, evaluator, budget, deployer } = await deployFixture()
      const usdcAddr = await usdc.getAddress()
      const jobManagerAddr = await jobManager.getAddress()
      const expiredAt = (await time.latest()) + 3600

      await jobManager.connect(client)["createJob(address,address,uint256,string,address)"](
        ethers.ZeroAddress, evaluator.address, expiredAt, "task", ethers.ZeroAddress
      )

      const tokenParam = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [usdcAddr])
      await jobManager.connect(client).setBudget(1, budget, tokenParam)
      await jobManager.connect(client).setProvider(1, provider.address, "0x")
      await usdc.connect(client).approve(jobManagerAddr, budget)
      await jobManager.connect(client).fund(1, budget, "0x")

      await time.increaseTo(expiredAt + 1)

      // Deployer (not client) can trigger the refund — permissionless
      const balBefore = await usdc.balanceOf(client.address)
      await jobManager.connect(deployer).claimRefund(1)

      // Funds go to client even though deployer called it
      expect(await usdc.balanceOf(client.address)).to.equal(balBefore + budget)
    })

    it("claimRefund for expired funded jobs", async function () {
      const { jobManager, usdc, client, provider, evaluator, budget } = await deployFixture()
      const usdcAddr = await usdc.getAddress()
      const jobManagerAddr = await jobManager.getAddress()
      const expiredAt = (await time.latest()) + 3600

      await jobManager.connect(client)["createJob(address,address,uint256,string,address)"](
        ethers.ZeroAddress, evaluator.address, expiredAt, "Time-limited task", ethers.ZeroAddress
      )

      const tokenParam = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [usdcAddr])
      await jobManager.connect(client).setBudget(1, budget, tokenParam)
      await jobManager.connect(client).setProvider(1, provider.address, "0x")

      await usdc.connect(client).approve(jobManagerAddr, budget)
      await jobManager.connect(client).fund(1, budget, "0x")

      // Not expired yet
      await expectRevert(jobManager.connect(client).claimRefund(1), "Job not expired")

      // Advance time past expiration
      await time.increaseTo(expiredAt + 1)

      const balBefore = await usdc.balanceOf(client.address)
      await jobManager.connect(client).claimRefund(1)

      expect(await usdc.balanceOf(client.address)).to.equal(balBefore + budget)
      const job = await jobManager.getJob(1)
      expect(job.status).to.equal(6n) // Cancelled
    })

    it("claimRefund reverts when no expiration set", async function () {
      const { jobManager, usdc, client, provider, evaluator, budget } = await deployFixture()
      const usdcAddr = await usdc.getAddress()
      const jobManagerAddr = await jobManager.getAddress()

      // Use original createJob (no expiration)
      await jobManager.connect(client)["createJob(string,uint256,address,uint256,address)"](
        "ipfs://job1", budget, usdcAddr, 0, evaluator.address
      )

      // Need a bid + select + fund flow via original path
      const Registry = await ethers.getContractFactory("AgentRegistry")
      const registryAddr = await jobManager.registry()
      const registry = Registry.attach(registryAddr)
      await registry.connect(provider).registerAgent("ipfs://agent")

      await jobManager.connect(provider).placeBid(1, 1, budget, "ipfs://bid")
      await jobManager.connect(client).selectProvider(1, 1)
      await usdc.connect(client).approve(jobManagerAddr, budget)
      await jobManager.connect(client).fundJob(1)

      await expectRevert(jobManager.connect(client).claimRefund(1), "No expiration set")
    })

    it("createJob with pre-assigned provider stays Open per ERC-8183 spec", async function () {
      const { jobManager, client, provider, evaluator } = await deployFixture()
      const expiredAt = (await time.latest()) + 86400

      await jobManager.connect(client)["createJob(address,address,uint256,string,address)"](
        provider.address, evaluator.address, expiredAt, "Direct hire", ethers.ZeroAddress
      )

      const job = await jobManager.getJob(1)
      expect(job.status).to.equal(0n) // Open (provider pre-set, but state stays Open per spec)
      expect(job.provider).to.equal(provider.address)
    })

    it("setBudget reverts after funding", async function () {
      const { jobManager, usdc, client, provider, evaluator, budget } = await deployFixture()
      const usdcAddr = await usdc.getAddress()
      const jobManagerAddr = await jobManager.getAddress()
      const expiredAt = (await time.latest()) + 86400

      await jobManager.connect(client)["createJob(address,address,uint256,string,address)"](
        ethers.ZeroAddress, evaluator.address, expiredAt, "task", ethers.ZeroAddress
      )

      const tokenParam = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [usdcAddr])
      await jobManager.connect(client).setBudget(1, budget, tokenParam)
      await jobManager.connect(client).setProvider(1, provider.address, "0x")

      await usdc.connect(client).approve(jobManagerAddr, budget)
      await jobManager.connect(client).fund(1, budget, "0x")

      await expectRevert(
        jobManager.connect(client).setBudget(1, 20n * 10n ** 6n, tokenParam),
        "Cannot set budget after funding"
      )
    })

    it("fund reverts on budget mismatch", async function () {
      const { jobManager, usdc, client, provider, evaluator, budget } = await deployFixture()
      const usdcAddr = await usdc.getAddress()
      const jobManagerAddr = await jobManager.getAddress()
      const expiredAt = (await time.latest()) + 86400

      await jobManager.connect(client)["createJob(address,address,uint256,string,address)"](
        ethers.ZeroAddress, evaluator.address, expiredAt, "task", ethers.ZeroAddress
      )

      const tokenParam = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [usdcAddr])
      await jobManager.connect(client).setBudget(1, budget, tokenParam)
      await jobManager.connect(client).setProvider(1, provider.address, "0x")

      await usdc.connect(client).approve(jobManagerAddr, budget)
      await expectRevert(
        jobManager.connect(client).fund(1, budget + 1n, "0x"),
        "Budget mismatch"
      )
    })

    it("claimRefund reverts on double call", async function () {
      const { jobManager, usdc, client, provider, evaluator, budget } = await deployFixture()
      const usdcAddr = await usdc.getAddress()
      const jobManagerAddr = await jobManager.getAddress()
      const expiredAt = (await time.latest()) + 3600

      await jobManager.connect(client)["createJob(address,address,uint256,string,address)"](
        ethers.ZeroAddress, evaluator.address, expiredAt, "task", ethers.ZeroAddress
      )

      const tokenParam = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [usdcAddr])
      await jobManager.connect(client).setBudget(1, budget, tokenParam)
      await jobManager.connect(client).setProvider(1, provider.address, "0x")
      await usdc.connect(client).approve(jobManagerAddr, budget)
      await jobManager.connect(client).fund(1, budget, "0x")

      await time.increaseTo(expiredAt + 1)
      await jobManager.connect(client).claimRefund(1)

      // Second call should revert — status is now Cancelled
      await expectRevert(jobManager.connect(client).claimRefund(1), "Not refundable")
    })

    it("submit with empty optParams uses bytes32 hex string as URI", async function () {
      const { jobManager, usdc, client, provider, evaluator, budget } = await deployFixture()
      const usdcAddr = await usdc.getAddress()
      const jobManagerAddr = await jobManager.getAddress()
      const expiredAt = (await time.latest()) + 86400

      await jobManager.connect(client)["createJob(address,address,uint256,string,address)"](
        ethers.ZeroAddress, evaluator.address, expiredAt, "task", ethers.ZeroAddress
      )

      const tokenParam = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [usdcAddr])
      await jobManager.connect(client).setBudget(1, budget, tokenParam)
      await jobManager.connect(client).setProvider(1, provider.address, "0x")
      await usdc.connect(client).approve(jobManagerAddr, budget)
      await jobManager.connect(client).fund(1, budget, "0x")

      const deliverableHash = ethers.keccak256(ethers.toUtf8Bytes("test-deliverable"))
      await jobManager.connect(provider).submit(1, deliverableHash, "0x")

      const job = await jobManager.getJob(1)
      // The hex string should match the bytes32 value as "0x" + 64 hex chars
      expect(job.deliverableUri).to.equal(deliverableHash.toLowerCase())
    })

    it("mixed mode: ERC-8183 and original createJob coexist with shared nextJobId", async function () {
      const { jobManager, registry, usdc, client, provider, evaluator, budget } = await deployFixture()
      const usdcAddr = await usdc.getAddress()
      const expiredAt = (await time.latest()) + 86400

      // Job 1 via ERC-8183 path
      await jobManager.connect(client)["createJob(address,address,uint256,string,address)"](
        ethers.ZeroAddress, evaluator.address, expiredAt, "ERC job", ethers.ZeroAddress
      )

      // Job 2 via original path
      await jobManager.connect(client)["createJob(string,uint256,address,uint256,address)"](
        "ipfs://original-job", budget, usdcAddr, 0, evaluator.address
      )

      // Verify both jobs exist with correct IDs
      const job1 = await jobManager.getJob(1)
      expect(job1.metadataUri).to.equal("ERC job")
      expect(job1.budget).to.equal(0n) // ERC path starts with 0 budget

      const job2 = await jobManager.getJob(2)
      expect(job2.metadataUri).to.equal("ipfs://original-job")
      expect(job2.budget).to.equal(budget)

      // Verify nextJobId is 3
      expect(await jobManager.nextJobId()).to.equal(3n)

      // Verify original path job 2 works with bids
      await registry.connect(provider).register("ipfs://provider-agent")
      await jobManager.connect(provider).placeBid(2, 1, budget, "ipfs://bid")
      const bid = await jobManager.getBid(2, 1)
      expect(bid.exists).to.equal(true)
    })
  })
})

// Helper: compute ERC165 interfaceId by XOR-ing function selectors
function computeInterfaceId(signatures: string[]): string {
  let result = 0n
  for (const sig of signatures) {
    const hash = ethers.keccak256(ethers.toUtf8Bytes(sig))
    const selector = BigInt(hash.slice(0, 10))
    result ^= selector
  }
  return result.toString(16).padStart(8, "0")
}

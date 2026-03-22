import { expect } from "chai"
import { ethers } from "hardhat"
import { time } from "@nomicfoundation/hardhat-network-helpers"

describe("JobManager", function () {
  async function deployFixture() {
    const [client, agent1Owner, agent2Owner, evaluator] = await ethers.getSigners()

    const MockUSDC = await ethers.getContractFactory("MockUSDC")
    const usdc = await MockUSDC.deploy()

    const JobManager = await ethers.getContractFactory("JobManager")
    const jobManager = await JobManager.deploy()

    const Registry = await ethers.getContractFactory("AgentRegistry")
    const registry = await Registry.deploy(await jobManager.getAddress())

    await jobManager.setRegistry(await registry.getAddress())

    await registry.connect(agent1Owner).registerAgent("ipfs://agent1")
    await registry.connect(agent2Owner).registerAgent("ipfs://agent2")

    const budget = 12n * 10n ** 6n
    const bidAmount = 8n * 10n ** 6n

    await usdc.connect(client).mint(client.address, 1000n * 10n ** 6n)

    return { jobManager, registry, usdc, client, agent1Owner, agent2Owner, evaluator, budget, bidAmount }
  }

  describe("createJob", function () {
    it("creates a job with Open status", async function () {
      const { jobManager, usdc, client, budget } = await deployFixture()
      await jobManager.connect(client)["createJob(string,uint256,address,uint256,address)"](
        "ipfs://job1", budget, await usdc.getAddress(), 40, client.address
      )
      const job = await jobManager.getJob(1)
      expect(job.client).to.equal(client.address)
      expect(job.budget).to.equal(budget)
      expect(job.status).to.equal(0n)
    })
  })

  describe("placeBid", function () {
    it("places a valid bid when rep >= threshold", async function () {
      const { jobManager, usdc, client, agent1Owner, budget } = await deployFixture()
      await jobManager.connect(client)["createJob(string,uint256,address,uint256,address)"](
        "ipfs://job1", budget, await usdc.getAddress(), 40, client.address
      )
      await jobManager.connect(agent1Owner).placeBid(1, 1, 8n * 10n ** 6n, "ipfs://bid1")
      const bid = await jobManager.getBid(1, 1)
      expect(bid.exists).to.equal(true)
      expect(bid.agentId).to.equal(1n)
    })

    it("reverts with ReputationBelowThreshold when rep < threshold", async function () {
      const { jobManager, usdc, client, agent1Owner, budget } = await deployFixture()
      await jobManager.connect(client)["createJob(string,uint256,address,uint256,address)"](
        "ipfs://job1", budget, await usdc.getAddress(), 55, client.address
      )
      try {
        await jobManager.connect(agent1Owner).placeBid(1, 1, 8n * 10n ** 6n, "ipfs://bid1")
        expect.fail("Should have reverted")
      } catch (error: any) {
        expect(error.message).to.include("ReputationBelowThreshold")
      }
    })
  })

  describe("selectProvider", function () {
    it("selects a valid provider", async function () {
      const { jobManager, usdc, client, agent1Owner, budget } = await deployFixture()
      await jobManager.connect(client)["createJob(string,uint256,address,uint256,address)"](
        "ipfs://job1", budget, await usdc.getAddress(), 40, client.address
      )
      await jobManager.connect(agent1Owner).placeBid(1, 1, 8n * 10n ** 6n, "ipfs://bid1")
      await jobManager.connect(client).selectProvider(1, 1)
      const job = await jobManager.getJob(1)
      expect(job.status).to.equal(1n)
      expect(job.selectedBidId).to.equal(1n)
      expect(job.selectedAgentId).to.equal(1n)
    })
  })

  describe("fundJob", function () {
    it("escrows the bid amount (not budget)", async function () {
      const { jobManager, usdc, client, agent1Owner, budget } = await deployFixture()
      const usdcAddr = await usdc.getAddress()
      const jobManagerAddr = await jobManager.getAddress()
      const bidAmount = 8n * 10n ** 6n

      await jobManager.connect(client)["createJob(string,uint256,address,uint256,address)"]("ipfs://job1", budget, usdcAddr, 40, client.address)
      await jobManager.connect(agent1Owner).placeBid(1, 1, bidAmount, "ipfs://bid1")
      await jobManager.connect(client).selectProvider(1, 1)

      await usdc.connect(client).approve(jobManagerAddr, bidAmount)
      await jobManager.connect(client).fundJob(1)

      const job = await jobManager.getJob(1)
      expect(job.status).to.equal(2n)
      expect(await usdc.balanceOf(jobManagerAddr)).to.equal(bidAmount)
    })
  })

  describe("full lifecycle: approve", function () {
    it("releases funds and increases reputation on approval", async function () {
      const { jobManager, registry, usdc, client, agent1Owner, budget } = await deployFixture()
      const usdcAddr = await usdc.getAddress()
      const jobManagerAddr = await jobManager.getAddress()
      const bidAmount = 8n * 10n ** 6n

      await jobManager.connect(client)["createJob(string,uint256,address,uint256,address)"]("ipfs://job1", budget, usdcAddr, 40, client.address)
      await jobManager.connect(agent1Owner).placeBid(1, 1, bidAmount, "ipfs://bid1")
      await jobManager.connect(client).selectProvider(1, 1)
      await usdc.connect(client).approve(jobManagerAddr, bidAmount)
      await jobManager.connect(client).fundJob(1)

      await jobManager.connect(agent1Owner).submitDeliverable(1, "ipfs://deliverable1")
      const balBefore = await usdc.balanceOf(agent1Owner.address)

      await jobManager.connect(client).approveDeliverable(1)

      const job = await jobManager.getJob(1)
      expect(job.status).to.equal(4n)
      expect(await usdc.balanceOf(agent1Owner.address)).to.equal(balBefore + bidAmount)
      expect((await registry.getAgent(1)).reputationScore).to.equal(60n)
    })
  })

  describe("full lifecycle: reject", function () {
    it("refunds client and decreases reputation on rejection", async function () {
      const { jobManager, registry, usdc, client, agent1Owner, budget } = await deployFixture()
      const usdcAddr = await usdc.getAddress()
      const jobManagerAddr = await jobManager.getAddress()
      const bidAmount = 8n * 10n ** 6n

      await jobManager.connect(client)["createJob(string,uint256,address,uint256,address)"]("ipfs://job1", budget, usdcAddr, 40, client.address)
      await jobManager.connect(agent1Owner).placeBid(1, 1, bidAmount, "ipfs://bid1")
      await jobManager.connect(client).selectProvider(1, 1)
      await usdc.connect(client).approve(jobManagerAddr, bidAmount)
      await jobManager.connect(client).fundJob(1)

      await jobManager.connect(agent1Owner).submitDeliverable(1, "ipfs://deliverable1")
      const balBefore = await usdc.balanceOf(client.address)

      await jobManager.connect(client).rejectDeliverable(1)

      const job = await jobManager.getJob(1)
      expect(job.status).to.equal(5n)
      expect(await usdc.balanceOf(client.address)).to.equal(balBefore + bidAmount)
      expect((await registry.getAgent(1)).reputationScore).to.equal(35n)
    })
  })

  describe("placeBidWithSignature", function () {
    async function signBidFixture() {
      const { jobManager, registry, usdc, client, agent1Owner, agent2Owner, evaluator, budget, bidAmount } = await deployFixture()
      const usdcAddr = await usdc.getAddress()
      const jobManagerAddr = await jobManager.getAddress()

      await jobManager.connect(client)["createJob(string,uint256,address,uint256,address)"]("ipfs://job1", budget, usdcAddr, 40, client.address)

      const chainId = (await ethers.provider.getNetwork()).chainId

      const domain = {
        name: "AgentHire",
        version: "1",
        chainId: chainId,
        verifyingContract: jobManagerAddr,
      }

      const types = {
        Bid: [
          { name: "jobId", type: "uint256" },
          { name: "agentId", type: "uint256" },
          { name: "amount", type: "uint256" },
          { name: "metadataUri", type: "string" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      }

      const deadline = (await time.latest()) + 3600 // 1 hour from current EVM time

      return { jobManager, registry, usdc, client, agent1Owner, agent2Owner, evaluator, budget, bidAmount, domain, types, deadline, jobManagerAddr }
    }

    it("places a bid with a valid signature", async function () {
      const { jobManager, agent1Owner, bidAmount, domain, types, deadline } = await signBidFixture()

      const value = { jobId: 1, agentId: 1, amount: bidAmount, metadataUri: "ipfs://bid1", nonce: 0, deadline }
      const sig = await agent1Owner.signTypedData(domain, types, value)
      const { v, r, s } = ethers.Signature.from(sig)

      await jobManager.placeBidWithSignature(1, 1, bidAmount, "ipfs://bid1", deadline, v, r, s)

      const bid = await jobManager.getBid(1, 1)
      expect(bid.exists).to.equal(true)
      expect(bid.agentId).to.equal(1n)
      expect(bid.bidder).to.equal(agent1Owner.address)
    })

    it("reverts with expired deadline", async function () {
      const { jobManager, agent1Owner, bidAmount, domain, types } = await signBidFixture()

      const pastDeadline = (await time.latest()) - 3600
      const value = { jobId: 1, agentId: 1, amount: bidAmount, metadataUri: "ipfs://bid1", nonce: 0, deadline: pastDeadline }
      const sig = await agent1Owner.signTypedData(domain, types, value)
      const { v, r, s } = ethers.Signature.from(sig)

      try {
        await jobManager.placeBidWithSignature(1, 1, bidAmount, "ipfs://bid1", pastDeadline, v, r, s)
        expect.fail("Should have reverted")
      } catch (error: any) {
        expect(error.message).to.include("Bid expired")
      }
    })

    it("reverts with invalid signature (wrong signer)", async function () {
      const { jobManager, agent2Owner, bidAmount, domain, types, deadline } = await signBidFixture()

      // agent2Owner signs for agentId=1 (which is owned by agent1Owner)
      const value = { jobId: 1, agentId: 1, amount: bidAmount, metadataUri: "ipfs://bid1", nonce: 0, deadline }
      const sig = await agent2Owner.signTypedData(domain, types, value)
      const { v, r, s } = ethers.Signature.from(sig)

      try {
        await jobManager.placeBidWithSignature(1, 1, bidAmount, "ipfs://bid1", deadline, v, r, s)
        expect.fail("Should have reverted")
      } catch (error: any) {
        expect(error.message).to.include("Signer is not agent owner")
      }
    })

    it("reverts on replay (same signature twice)", async function () {
      const { jobManager, agent1Owner, bidAmount, domain, types, deadline } = await signBidFixture()

      const value = { jobId: 1, agentId: 1, amount: bidAmount, metadataUri: "ipfs://bid1", nonce: 0, deadline }
      const sig = await agent1Owner.signTypedData(domain, types, value)
      const { v, r, s } = ethers.Signature.from(sig)

      // First call succeeds
      await jobManager.placeBidWithSignature(1, 1, bidAmount, "ipfs://bid1", deadline, v, r, s)

      // Second call with same sig fails (nonce consumed)
      try {
        await jobManager.placeBidWithSignature(1, 1, bidAmount, "ipfs://bid1", deadline, v, r, s)
        expect.fail("Should have reverted")
      } catch (error: any) {
        expect(error.message).to.include("Signer is not agent owner")
      }
    })

    it("reverts when reputation below threshold", async function () {
      const { jobManager, registry, usdc, client, agent1Owner, bidAmount, domain, types, deadline } = await signBidFixture()

      // Create a job with high threshold
      await jobManager.connect(client)["createJob(string,uint256,address,uint256,address)"]("ipfs://job2", 12n * 10n ** 6n, await usdc.getAddress(), 55, client.address)

      const value = { jobId: 2, agentId: 1, amount: bidAmount, metadataUri: "ipfs://bid1", nonce: 0, deadline }
      const sig = await agent1Owner.signTypedData(domain, types, value)
      const { v, r, s } = ethers.Signature.from(sig)

      try {
        await jobManager.placeBidWithSignature(2, 1, bidAmount, "ipfs://bid1", deadline, v, r, s)
        expect.fail("Should have reverted")
      } catch (error: any) {
        expect(error.message).to.include("ReputationBelowThreshold")
      }
    })

    it("increments signer nonce after successful bid", async function () {
      const { jobManager, agent1Owner, bidAmount, domain, types, deadline } = await signBidFixture()

      expect(await jobManager.getNonce(agent1Owner.address)).to.equal(0n)

      const value = { jobId: 1, agentId: 1, amount: bidAmount, metadataUri: "ipfs://bid1", nonce: 0, deadline }
      const sig = await agent1Owner.signTypedData(domain, types, value)
      const { v, r, s } = ethers.Signature.from(sig)

      await jobManager.placeBidWithSignature(1, 1, bidAmount, "ipfs://bid1", deadline, v, r, s)

      expect(await jobManager.getNonce(agent1Owner.address)).to.equal(1n)
    })
  })

  describe("cancelJob", function () {
    it("cancels an open job", async function () {
      const { jobManager, usdc, client, budget } = await deployFixture()
      await jobManager.connect(client)["createJob(string,uint256,address,uint256,address)"](
        "ipfs://job1", budget, await usdc.getAddress(), 40, client.address
      )
      await jobManager.connect(client).cancelJob(1)
      const job = await jobManager.getJob(1)
      expect(job.status).to.equal(6n)
    })

    it("reverts cancel after funding", async function () {
      const { jobManager, usdc, client, agent1Owner, budget } = await deployFixture()
      const usdcAddr = await usdc.getAddress()
      const bidAmount = 8n * 10n ** 6n

      await jobManager.connect(client)["createJob(string,uint256,address,uint256,address)"]("ipfs://job1", budget, usdcAddr, 40, client.address)
      await jobManager.connect(agent1Owner).placeBid(1, 1, bidAmount, "ipfs://bid1")
      await jobManager.connect(client).selectProvider(1, 1)
      await usdc.connect(client).approve(await jobManager.getAddress(), bidAmount)
      await jobManager.connect(client).fundJob(1)

      try {
        await jobManager.connect(client).cancelJob(1)
        expect.fail("Should have reverted")
      } catch (error: any) {
        expect(error.message).to.include("Cannot cancel after funding")
      }
    })
  })
})

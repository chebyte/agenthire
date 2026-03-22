import { expect } from "chai"
import { ethers } from "hardhat"

describe("AgentRegistry", function () {
  async function deployFixture() {
    const [owner, jobManager, agent1, agent2] = await ethers.getSigners()
    const Registry = await ethers.getContractFactory("AgentRegistry")
    const registry = await Registry.deploy(jobManager.address)
    return { registry, owner, jobManager, agent1, agent2 }
  }

  it("registers an agent with initial reputation 50", async function () {
    const { registry, agent1 } = await deployFixture()
    await registry.connect(agent1).registerAgent("ipfs://meta1")
    const agent = await registry.getAgent(1)
    expect(agent.owner).to.equal(agent1.address)
    expect(agent.metadataUri).to.equal("ipfs://meta1")
    expect(agent.reputationScore).to.equal(50n)
    expect(agent.active).to.equal(true)
  })

  it("emits AgentRegistered event", async function () {
    const { registry, agent1 } = await deployFixture()
    const tx = await registry.connect(agent1).registerAgent("ipfs://meta1")
    const receipt = await tx.wait()
    const event = receipt?.logs.map((log: any) => {
      try { return registry.interface.parseLog({ topics: log.topics as string[], data: log.data }) } catch { return null }
    }).find((e: any) => e?.name === "AgentRegistered")
    expect(event).to.not.be.null
    expect(event!.args[0]).to.equal(1n) // agentId
    expect(event!.args[1]).to.equal(agent1.address) // owner
    expect(event!.args[2]).to.equal("ipfs://meta1") // metadataUri
  })

  it("updates metadata only by owner", async function () {
    const { registry, agent1, agent2 } = await deployFixture()
    await registry.connect(agent1).registerAgent("ipfs://meta1")
    await registry.connect(agent1).updateMetadataUri(1, "ipfs://meta2")
    const agent = await registry.getAgent(1)
    expect(agent.metadataUri).to.equal("ipfs://meta2")
    try {
      await registry.connect(agent2).updateMetadataUri(1, "ipfs://hack")
      expect.fail("Should have reverted")
    } catch (error: any) {
      expect(error.message).to.include("Not agent owner")
    }
  })

  it("updates reputation only by jobManager, clamped 0-100", async function () {
    const { registry, jobManager, agent1 } = await deployFixture()
    await registry.connect(agent1).registerAgent("ipfs://meta1")
    // +10: 50 -> 60
    await registry.connect(jobManager).updateReputation(1, 10, 1)
    expect((await registry.getAgent(1)).reputationScore).to.equal(60n)
    // +50: 60 -> 100 (clamped)
    await registry.connect(jobManager).updateReputation(1, 50, 2)
    expect((await registry.getAgent(1)).reputationScore).to.equal(100n)
    // -120: 100 -> 0 (clamped)
    await registry.connect(jobManager).updateReputation(1, -120, 3)
    expect((await registry.getAgent(1)).reputationScore).to.equal(0n)
  })

  it("rejects reputation update from non-jobManager", async function () {
    const { registry, agent1 } = await deployFixture()
    await registry.connect(agent1).registerAgent("ipfs://meta1")
    try {
      await registry.connect(agent1).updateReputation(1, 10, 1)
      expect.fail("Should have reverted")
    } catch (error: any) {
      expect(error.message).to.satisfy((msg: string) =>
        msg.includes("Not authorized") || msg.includes("reverted")
      )
    }
  })

  it("deactivates and reactivates agent", async function () {
    const { registry, agent1 } = await deployFixture()
    await registry.connect(agent1).registerAgent("ipfs://meta1")
    await registry.connect(agent1).deactivateAgent(1)
    expect((await registry.getAgent(1)).active).to.equal(false)
    await registry.connect(agent1).reactivateAgent(1)
    expect((await registry.getAgent(1)).active).to.equal(true)
  })

  it("auto-increments agent IDs", async function () {
    const { registry, agent1, agent2 } = await deployFixture()
    await registry.connect(agent1).registerAgent("ipfs://meta1")
    await registry.connect(agent2).registerAgent("ipfs://meta2")
    expect((await registry.getAgent(1)).owner).to.equal(agent1.address)
    expect((await registry.getAgent(2)).owner).to.equal(agent2.address)
  })

  it("allows deployer to set reputation for testing", async function () {
    const { registry, owner, agent1 } = await deployFixture()
    await registry.connect(agent1).registerAgent("ipfs://meta1")
    await registry.connect(owner).setReputationForTesting(1, 72)
    expect((await registry.getAgent(1)).reputationScore).to.equal(72n)
  })
})

import { expect } from "chai"
import { ethers } from "hardhat"

describe("MockUSDC", function () {
  async function deployFixture() {
    const [owner, user1, user2] = await ethers.getSigners()
    const MockUSDC = await ethers.getContractFactory("MockUSDC")
    const usdc = await MockUSDC.deploy()
    return { usdc, owner, user1, user2 }
  }

  it("has correct name and symbol", async function () {
    const { usdc } = await deployFixture()
    expect(await usdc.name()).to.equal("Mock USDC")
    expect(await usdc.symbol()).to.equal("USDC")
  })

  it("has 6 decimals", async function () {
    const { usdc } = await deployFixture()
    expect(await usdc.decimals()).to.equal(6n)
  })

  it("allows anyone to mint", async function () {
    const { usdc, user1 } = await deployFixture()
    const amount = 100n * 10n ** 6n
    await usdc.connect(user1).mint(user1.address, amount)
    expect(await usdc.balanceOf(user1.address)).to.equal(amount)
  })

  it("supports standard ERC20 transfer", async function () {
    const { usdc, user1, user2 } = await deployFixture()
    const amount = 50n * 10n ** 6n
    await usdc.connect(user1).mint(user1.address, amount)
    await usdc.connect(user1).transfer(user2.address, amount)
    expect(await usdc.balanceOf(user2.address)).to.equal(amount)
  })
})

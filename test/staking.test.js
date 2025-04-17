const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StakingWithEmissions", function () {
  let staking, sansu, owner;

  beforeEach(async () => {
    [owner] = await ethers.getSigners();

    const Sansu = await ethers.getContractFactory("SansuCoin");
    const Staking = await ethers.getContractFactory("StakingWithEmissions");

    staking = await Staking.deploy(ethers.ZeroAddress); // dummy token address
    await staking.waitForDeployment();

    sansu = await Sansu.deploy(await staking.getAddress());
    await sansu.waitForDeployment();

    await staking.updateToken(await sansu.getAddress());
  });

  it("should accumulate rewards correctly after staking and waiting", async () => {
    // Stake 10 ETH
    await staking.stake(ethers.parseEther("10"), { value: ethers.parseEther("10") });

    // Simulate 10 seconds of wait time
    await ethers.provider.send("evm_increaseTime", [10]);
    await ethers.provider.send("evm_mine");

    const rewards = await staking.getRewards(owner.address);
    console.log("Pending rewards after 10s:", ethers.formatEther(rewards), "SANSU");

    expect(Number(ethers.formatEther(rewards))).to.be.closeTo(100, 0.1); // 10 ETH x 10s x 1 token/sec
  });
});

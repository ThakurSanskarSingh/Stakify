const hre = require("hardhat");

async function main() {
  // Deploy StakingWithEmissions first with a temporary token address
  console.log("Deploying StakingWithEmissions...");
  const StakingWithEmissions = await hre.ethers.getContractFactory("StakingWithEmissions");
  const stakingWithEmissions = await StakingWithEmissions.deploy("0x0000000000000000000000000000000000000000"); // Temporary address
  await stakingWithEmissions.waitForDeployment();
  const stakingAddress = await stakingWithEmissions.getAddress();
  console.log("StakingWithEmissions deployed to:", stakingAddress);

  // Deploy SansuCoin with the staking contract address
  console.log("Deploying SansuCoin...");
  const SansuCoin = await hre.ethers.getContractFactory("SansuCoin");
  const sansuCoin = await SansuCoin.deploy(stakingAddress);
  await sansuCoin.waitForDeployment();
  const sansuCoinAddress = await sansuCoin.getAddress();
  console.log("SansuCoin deployed to:", sansuCoinAddress);

  // Update StakingWithEmissions with the correct token address
  console.log("Updating StakingWithEmissions with SansuCoin address...");
  const updateTx = await stakingWithEmissions.updateToken(sansuCoinAddress);
  await updateTx.wait();
  console.log("Setup complete!");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 
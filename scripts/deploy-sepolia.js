const hre = require("hardhat");

async function main() {
  console.log("Deploying contracts to Sepolia testnet...");

  // Deploy StakingWithEmissions first with a temporary token address
  console.log("Deploying StakingWithEmissions...");
  const Staking = await hre.ethers.getContractFactory("StakingWithEmissions");
  const staking = await Staking.deploy("0x0000000000000000000000000000000000000000"); // Temporary zero address
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("StakingWithEmissions deployed to:", stakingAddress);

  // Deploy SansuCoin with the staking contract address
  console.log("Deploying SansuCoin...");
  const SansuCoin = await hre.ethers.getContractFactory("SansuCoin");
  const sansuCoin = await SansuCoin.deploy(stakingAddress);
  await sansuCoin.waitForDeployment();
  const sansuCoinAddress = await sansuCoin.getAddress();
  console.log("SansuCoin deployed to:", sansuCoinAddress);

  // Update StakingWithEmissions with the actual SansuCoin address
  console.log("Updating StakingWithEmissions with SansuCoin address...");
  await staking.updateToken(sansuCoinAddress);
  console.log("StakingWithEmissions updated with SansuCoin address");

  console.log("\nDeployment complete!");
  console.log("SansuCoin address:", sansuCoinAddress);
  console.log("StakingWithEmissions address:", stakingAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
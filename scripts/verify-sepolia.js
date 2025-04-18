const hre = require("hardhat");

async function main() {
  const contractAddress = "0x0b70aD4f6dE3b1EdE3C1F12a5FE1b30A36ceB1fc";
  const constructorArgs = ["0x0000000000000000000000000000000000000000"];

  console.log("Verifying contract on Sepolia...");
  
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArgs,
      network: "sepolia"
    });
    console.log("Contract verified successfully!");
  } catch (error) {
    console.error("Verification failed:", error.message);
    if (error.message.includes("already verified")) {
      console.log("Contract is already verified!");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
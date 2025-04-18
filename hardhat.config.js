require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    mainnet: {
      url: process.env.MAINNET_RPC_URL || "https://eth-mainnet.g.alchemy.com/v2/your-api-key",
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 50000000000, // 50 gwei
      gasMultiplier: 1.2,
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/your-api-key",
      accounts: [process.env.PRIVATE_KEY],
    },
    // Add your network configurations here
    hardhat: { chainId: 31337 
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
      chainId: 31337
    },
    // Example for testnet:
    // goerli: {
    //   url: `https://goerli.infura.io/v3/${INFURA_PROJECT_ID}`,
    //   accounts: [PRIVATE_KEY]
    // }
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY,
      mainnet: process.env.ETHERSCAN_API_KEY
    }
  },
  sourcify: {
    enabled: true
  }
}; 
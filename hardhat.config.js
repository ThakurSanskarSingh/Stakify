require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
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
  }
}; 
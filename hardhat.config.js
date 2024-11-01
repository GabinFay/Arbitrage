require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY_MAIN = process.env.PRIVATE_KEY_MAIN; 


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    localhost: {
      chainId: 31337
    },
    amoy: {
      url: "https://rpc-amoy.polygon.technology",
      accounts: [PRIVATE_KEY_MAIN],
      chainId: 80002,
      timeout: 60000 // Increase timeout to 60 seconds
    },
    apechain: {
      url: "https://apechain.calderachain.xyz",
      accounts: [PRIVATE_KEY_MAIN],
      chainId: 33139,
      timeout: 60000 // Increase timeout to 60 seconds
    },
    base: {
      url: "https://base-mainnet.infura.io/v3/c3fcc3655d78435ea4624d14e8b8ffa0",
      accounts: [PRIVATE_KEY_MAIN],
      chainId: 8453,
      timeout: 60000 // Increase timeout to 60 seconds
    },
    basesep: {
      url: "https://base-sepolia.infura.io/v3/c3fcc3655d78435ea4624d14e8b8ffa0",
      accounts: [PRIVATE_KEY_MAIN],
      chainId: 84532,
      timeout: 60000 // Increase timeout to 60 seconds
    },
    arbitrumOne: {
      url: "https://arb1.arbitrum.io/rpc",
      accounts: [PRIVATE_KEY_MAIN],
      chainId: 42161,
      timeout: 60000 // Keeping consistent with other networks
    }
  }
};

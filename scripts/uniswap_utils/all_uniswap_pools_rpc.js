const ethers = require('ethers');
require('dotenv').config();
const IUniswapV3FactoryABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json').abi;

// Network configurations
const NETWORK_CONFIGS = {
  'base-sepolia': {
    factoryAddress: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
    rpcUrl: process.env.INFURA_BASE_SEPOLIA_RPC
  },
  'optimism-sepolia': {
    factoryAddress: '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24', // Update this if different for Amoy
    rpcUrl: process.env.INFURA_OPTIMISM_SEPOLIA_RPC
  }
};

// Set the default network here
const DEFAULT_NETWORK = 'optimism-sepolia';
// const DEFAULT_NETWORK = 'base-sepolia'; // Uncomment to switch to Base Sepolia

const networkConfig = NETWORK_CONFIGS[DEFAULT_NETWORK];
const UNISWAP_FACTORY_ADDRESS = networkConfig.factoryAddress;
const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);

const privateKey = process.env.PRIVATE_KEY_MAIN;

const wallet = new ethers.Wallet(privateKey, provider);

// Add a retry mechanism and timeout
async function getProvider() {
  const maxRetries = 3;
  const timeout = 10000; // 10 seconds

  for (let i = 0; i < maxRetries; i++) {
    try {
      await provider.ready;
      const network = await provider.getNetwork();
      console.log(`Connected to network: ${network.name}`);
      return provider;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed: ${error.message}`);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
    }
  }
}

// Add this ERC20 ABI
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)"
];

async function getTokenInfo(tokenAddress) {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const name = await tokenContract.name();
    const symbol = await tokenContract.symbol();
    return { name, symbol };
  } catch (error) {
    console.error(`Error fetching token info for ${tokenAddress}: ${error.message}`);
    return { name: 'Unknown', symbol: 'UNKNOWN' };
  }
}

async function listAllPools() {
  try {
    console.log(`Using network: ${DEFAULT_NETWORK}`);
    const connectedProvider = await getProvider();
    const factory = new ethers.Contract(UNISWAP_FACTORY_ADDRESS, IUniswapV3FactoryABI, wallet);

    // Get the current block number
    const latestBlock = await connectedProvider.getBlockNumber();

    // Query for PoolCreated events from the beginning to the latest block
    const filter = factory.filters.PoolCreated();
    const events = await factory.queryFilter(filter, 0, latestBlock);

    console.log(`Total pools found: ${events.length}`);

    for (const event of events) {
      const { token0, token1, fee, pool } = event.args;
      
      const token0Info = await getTokenInfo(token0);
      const token1Info = await getTokenInfo(token1);

      console.log(`Pool address: ${pool}`);
      console.log(`Token0: ${token0} (${token0Info.name} - ${token0Info.symbol})`);
      console.log(`Token1: ${token1} (${token1Info.name} - ${token1Info.symbol})`);
      console.log(`Fee: ${fee}`);
      console.log('---');
    }
  } catch (error) {
    console.error('Error in listAllPools:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Main function to execute all steps
async function main() {
  try {
    await listAllPools();
  } catch (error) {
    console.error('Error in main function:', error.message);
  }
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

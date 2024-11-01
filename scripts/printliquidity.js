const ethers = require('ethers');
require('dotenv').config();
const IUniswapV3FactoryABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json').abi;
const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json').abi;
const fs = require('fs');

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

async function getPoolInfo(poolAddress) {
  const pool = new ethers.Contract(poolAddress, IUniswapV3PoolABI, provider);
  
  const [token0, token1, fee, tickSpacing, liquidity, slot0] = await Promise.all([
    pool.token0(),
    pool.token1(),
    pool.fee(),
    pool.tickSpacing(),
    pool.liquidity(),
    pool.slot0()
  ]);

  const [sqrtPriceX96, tick] = slot0;

  const token0Info = await getTokenInfo(token0);
  const token1Info = await getTokenInfo(token1);

  return {
    address: poolAddress,
    token0,
    token1,
    token0Info,
    token1Info,
    fee: fee.toString(),
    tickSpacing: tickSpacing.toString(),
    liquidity: liquidity.toString(),
    sqrtPriceX96: sqrtPriceX96.toString(),
    tick: tick.toString()
  };
}

async function getLiquidityData(poolAddress) {
  const pool = new ethers.Contract(poolAddress, IUniswapV3PoolABI, provider);
  const tickSpacingBigInt = await pool.tickSpacing();
  const tickSpacing = Number(tickSpacingBigInt); // Convert BigInt to number
  
  const [, currentTick] = await pool.slot0();
  const currentTickNumber = Number(currentTick);
  console.log(`Current tick: ${currentTickNumber}`);
  
  const minTick = Math.floor((currentTickNumber - 20 * tickSpacing) / tickSpacing) * tickSpacing;
  const maxTick = Math.ceil((currentTickNumber + 20 * tickSpacing) / tickSpacing) * tickSpacing;
  console.log(`Min tick: ${minTick}, Max tick: ${maxTick}`);
  
  const ticks = [];
  for (let i = minTick; i <= maxTick; i += tickSpacing) {
    const { liquidityNet } = await pool.ticks(i);
    ticks.push({ 
      tick: i.toString(), 
      liquidityNet: liquidityNet.toString()
    });
  }
  
  console.log(`Total ticks collected: ${ticks.length}`);
  return ticks;
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

    if (events.length > 0) {
      const firstPool = events[0].args.pool;
      try {
        const poolInfo = await getPoolInfo(firstPool);
        console.log('First pool details:');
        console.log(JSON.stringify(poolInfo, null, 2));

        const liquidityData = await getLiquidityData(firstPool);
        
        // Save liquidity data to a file
        fs.writeFileSync('liquidity_data.json', JSON.stringify(liquidityData));
        console.log('Liquidity data saved to liquidity_data.json');
        
        console.log('To plot the liquidity data, run the Python script: python plot_liquidity.py');
      } catch (poolError) {
        console.error('Error getting pool info:', poolError.message);
      }
    } else {
      console.log('No pools found.');
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

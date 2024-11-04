const { ethers } = require("hardhat");
require("dotenv").config();
const fs = require('fs');

// Load ABIs
const ICamelotPairABI = JSON.parse(fs.readFileSync('abis/ICamelotPairABI.json'));
const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json').abi;

// Initialize providers
const arbitrumProvider = new ethers.JsonRpcProvider(process.env.INFURA_ARBITRUM_RPC);
const apechainProvider = new ethers.JsonRpcProvider(process.env.APECHAIN_RPC);

async function getUniswapV3Price(poolAddress, provider) {
  const pool = new ethers.Contract(poolAddress, IUniswapV3PoolABI, provider);
  
  try {
    const slot0 = await pool.slot0();
    const sqrtPriceX96 = BigInt(slot0.sqrtPriceX96);
    const TWO_96 = 2n ** 96n;
    
    // Get token decimals
    const token0 = await pool.token0();
    const token1 = await pool.token1();
    const token0Contract = new ethers.Contract(token0, ['function decimals() view returns (uint8)'], provider);
    const token1Contract = new ethers.Contract(token1, ['function decimals() view returns (uint8)'], provider);
    const decimals0 = await token0Contract.decimals();
    const decimals1 = await token1Contract.decimals();
    
    // Calculate price accounting for decimals - all in BigInt
    const price = (sqrtPriceX96 * sqrtPriceX96 * BigInt(10n ** 18n)) / (TWO_96 * TWO_96);
    const decimalAdjustment = BigInt(10n ** BigInt(decimals0 - decimals1));
    const adjustedPrice = Number(price * decimalAdjustment) / 1e18;
    
    return adjustedPrice;
  } catch (error) {
    console.error("Error getting Uniswap price:", error);
    throw error;
  }
}

async function getCamelotPrice(pair, provider) {
  const pairContract = new ethers.Contract(pair, ICamelotPairABI, provider);
  
  try {
    const state = await pairContract.globalState();
    const sqrtPriceX96 = BigInt(state.price);
    const TWO_96 = 2n ** 96n;
    
    const sqrtPrice = Number(sqrtPriceX96) / Number(TWO_96);
    const price = sqrtPrice * sqrtPrice;
    
    return price;
  } catch (error) {
    console.error("Error getting Camelot price:", error);
    throw error;
  }
}

async function calculateArbitrage() {
  try {
    // Fetch prices in their native pool direction
    // Arbitrum prices
    const priceETH_USDC = await getUniswapV3Price(process.env.ARBITRUM_PAIR_WETH_USDC, arbitrumProvider); // ETH/USDC
    const priceAPE_WETH = await getCamelotPrice(process.env.ARBITRUM_PAIR_APE_WETH, arbitrumProvider);     // APE/WETH
    
    // Apechain prices
    const priceWAPE_APEETH = await getCamelotPrice(process.env.APECHAIN_PAIR_APEETH_WAPE, apechainProvider);   // WAPE/APEETH
    const priceAPEUSD_APEETH = await getCamelotPrice(process.env.APECHAIN_PAIR_APEUSD_APEETH, apechainProvider); // APEETH/APEUSD
    
    console.log(`Price ETH/USDC: ${priceETH_USDC}`);
    console.log(`Price APE/WETH: ${priceAPE_WETH}`);
    console.log(`Price WAPE/APEETH: ${priceWAPE_APEETH}`);
    console.log(`Price APEUSD/APEETH: ${priceAPEUSD_APEETH}`);
    
    // Calculate profits using inverses where needed
    const arbitrumToApeProfit = 1 / priceETH_USDC / priceAPE_WETH * priceWAPE_APEETH / priceAPEUSD_APEETH;
    const apeToArbitrumProfit = 1 / arbitrumToApeProfit;
    
    console.log(`Arbitrum -> Apechain Profit: ${arbitrumToApeProfit}`);
    console.log(`Apechain -> Arbitrum Profit: ${apeToArbitrumProfit}`);
    
    if (arbitrumToApeProfit > apeToArbitrumProfit) {
      console.log('Recommended Route: Arbitrum -> Apechain');
      console.log('Steps: USDC -> ETH -> APE (on Arbitrum) then bridge to Apechain');
    } else {
      console.log('Recommended Route: Apechain -> Arbitrum');
      console.log('Steps: USD -> ETH -> WAPE (on Apechain) then bridge to Arbitrum');
    }
    
  } catch (error) {
    console.error("Error calculating arbitrage:", error);
  }
}

calculateArbitrage(); 
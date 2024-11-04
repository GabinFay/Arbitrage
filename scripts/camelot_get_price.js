const { ethers } = require("hardhat");
require("dotenv").config();
const fs = require('fs');

// Load the ABI
const ICamelotPairABI = JSON.parse(fs.readFileSync('abis/ICamelotPairABI.json'));

// Set RPC URL and the Camelot pair address
const rpcUrl = process.env.APECHAIN_RPC;
const camelotPair = process.env.APECHAIN_PAIR_APEUSD_WAPE;

async function getCamelotPrice(pair, provider) {
  const pairContract = new ethers.Contract(pair, ICamelotPairABI, provider);
  
  try {
    // Get the current state which includes price and tick
    const state = await pairContract.globalState();
    
    // The price is in Q64.96 format
    const sqrtPriceX96 = BigInt(state.price);
    const TWO_96 = 2n ** 96n;
    
    // Convert the sqrt price to a regular price
    // First divide sqrtPriceX96 by 2^96 (as BigInts)
    const sqrtPrice = Number(sqrtPriceX96) / Number(TWO_96);
    // Then square it to get the actual price
    const price = sqrtPrice * sqrtPrice;
    
    return price;
  } catch (error) {
    console.error("Error in getCamelotPrice:", error);
    throw error;
  }
}

async function checkArbitrageOpportunity() {
  // Make sure to use the correct RPC URL for Apechain
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  try {
    const price = await getCamelotPrice(camelotPair, provider);
    console.log(`Price on Apechain: ${price} APEUSD/WAPE`);
  } catch (error) {
    console.error("Error calculating arbitrage:", error);
  }
}

checkArbitrageOpportunity();

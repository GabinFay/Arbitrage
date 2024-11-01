const { ethers } = require("ethers");
require('dotenv').config();

// ApeChain provider and contract details
const providerUrl = "https://apechain.calderachain.xyz"; // ApeChain RPC URL
const apeTokenAddress = process.env.APECHAIN_APE;
const wapeTokenAddress = process.env.APECHAIN_WAPE;
const apeAbi = [
    "function balanceOf(address owner) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transfer(address to, uint256 amount) returns (bool)"
];
const wapeAbi = [
    "function balanceOf(address owner) view returns (uint256)",
    "function wrap(uint256 amount) returns (bool)",
    "function unwrap(uint256 amount) returns (bool)"
];

// User's private key (never expose this in production code; use a secure method to handle private keys)
const privateKey = process.env.PRIVATE_KEY_MAIN;

// Initialize provider and signer
const provider = new ethers.providers.JsonRpcProvider(providerUrl);
const wallet = new ethers.Wallet(privateKey, provider);

async function wrapApeToWape(amountToWrap) {
  try {
    // Initialize the ApeCoin contract
    const apeContract = new ethers.Contract(apeTokenAddress, apeAbi, wallet);
    
    // Check the APE balance of the user
    const balance = await apeContract.balanceOf(wallet.address);
    if (balance.lt(amountToWrap)) {
      console.error("Insufficient APE balance");
      return;
    }
    
    // Inifinite approval for speeed & feee reduction
    
    // // Approve the WAPE contract to spend user's APE
    // const approveTx = await apeContract.approve(wapeTokenAddress, MAX_UINT256);
    // await approveTx.wait();
    // console.log("APE approved for wrapping");

    // Initialize the WAPE contract
    const wapeContract = new ethers.Contract(wapeTokenAddress, wapeAbi, wallet);

    // Call the wrap function on the WAPE contract
    const wrapTx = await wapeContract.wrap(amountToWrap);
    await wrapTx.wait();
    console.log(`Successfully wrapped ${amountToWrap.toString()} APE to WAPE`);
  } catch (error) {
    console.error("Error wrapping APE to WAPE:", error);
  }
}

// Amount to wrap (replace with desired amount in Wei)
const amount = ethers.utils.parseUnits("1", 18); // 1 APE

// Execute the wrap function
wrapApeToWape(amount);

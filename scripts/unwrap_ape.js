const { ethers } = require("ethers");
require('dotenv').config();

// ApeChain provider and contract details
const providerUrl = "https://apechain.calderachain.xyz";
const wapeTokenAddress = process.env.APECHAIN_WAPE;
const wapeAbi = [/* ... ABI for Wrapped ApeCoin contract ... */];

// User's private key from .env
const privateKey = process.env.PRIVATE_KEY_MAIN;

// Initialize provider and signer
const provider = new ethers.providers.JsonRpcProvider(providerUrl);
const wallet = new ethers.Wallet(privateKey, provider);

async function unwrapWapeToApe(amountToUnwrap) {
  try {
    // Initialize the WAPE contract
    const wapeContract = new ethers.Contract(wapeTokenAddress, wapeAbi, wallet);

    // Check WAPE balance
    const balance = await wapeContract.balanceOf(wallet.address);
    if (balance.lt(amountToUnwrap)) {
      console.error("Insufficient WAPE balance");
      return;
    }

    // Call the unwrap function to convert WAPE back to APE
    const unwrapTx = await wapeContract.unwrap(amountToUnwrap);
    await unwrapTx.wait();
    console.log(`Successfully unwrapped ${amountToUnwrap.toString()} WAPE to APE`);
  } catch (error) {
    console.error("Error unwrapping WAPE to APE:", error);
  }
}

// Amount to unwrap (replace with the desired amount in Wei)
const amount = ethers.utils.parseUnits("1", 18); // 1 WAPE

// Execute the unwrap function
unwrapWapeToApe(amount);

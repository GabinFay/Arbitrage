const { ethers } = require("hardhat");
const fs = require('fs');
require('dotenv').config();

// Load WAPE ABI
const wapeAbi = JSON.parse(fs.readFileSync('abis/wape_apechain.json'));

async function main() {
    const [signer] = await ethers.getSigners();
    const maxAmount = ethers.MaxUint256;  // Maximum possible amount (2^256 - 1)

    // Initialize WAPE contract
    const wapeContract = new ethers.Contract(
        process.env.APECHAIN_WAPE,
        wapeAbi,
        signer
    );

    console.log("Approving maximum WAPE spending...");
    const approveTx = await wapeContract.approve(
        process.env.APECHAIN_PAIR_APEETH_WAPE,
        maxAmount
    );
    await approveTx.wait();
    console.log("Maximum approval successful!");

    // Verify the allowance
    const allowance = await wapeContract.allowance(signer.address, process.env.APECHAIN_PAIR_APEETH_WAPE);
    console.log(`New allowance: ${allowance.toString()}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 
const { ethers } = require("hardhat");
const fs = require('fs');

require('dotenv').config();

// Load WAPE ABI
const wapeAbi = JSON.parse(fs.readFileSync('abis/wape_apechain.json'));

async function main() {
    const [signer] = await ethers.getSigners();
    const amount = ethers.parseEther("0.01"); // 1 APE

    // Initialize WAPE contract
    const wapeContract = new ethers.Contract(
        process.env.APECHAIN_WAPE,
        wapeAbi,
        signer
    );

    // Get WAPE balance
    const wapeBalance = await wapeContract.balanceOf(signer.address);
    console.log(`WAPE Balance: ${ethers.formatEther(wapeBalance)} WAPE`);

    console.log(`Unwrapping ${ethers.formatEther(amount)} WAPE to native APE...`);

    // Unwrap WAPE to native APE using the withdraw function
    const unwrapTx = await wapeContract.withdraw(amount);
    await unwrapTx.wait();

    console.log(`Successfully unwrapped ${ethers.formatEther(amount)} WAPE to APE`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
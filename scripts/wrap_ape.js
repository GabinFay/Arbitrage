const { ethers } = require("hardhat");
const fs = require('fs');

require('dotenv').config();

// Load WAPE ABI
const wapeAbi = JSON.parse(fs.readFileSync('abis/wape_apechain.json'));

async function main() {
    const [signer] = await ethers.getSigners();
    const amount = ethers.parseEther("1.5"); // 1 APE

    // Get native APE balance
    const nativeBalance = await ethers.provider.getBalance(signer.address);
    console.log(`Native APE Balance: ${ethers.formatEther(nativeBalance)} APE`);
    
    // Initialize WAPE contract
    const wapeContract = new ethers.Contract(
        process.env.APECHAIN_WAPE,
        wapeAbi,
        signer
    );

    console.log(`Wrapping ${ethers.formatEther(amount)} native APE to WAPE...`);

    // Wrap native APE to WAPE by sending directly to the contract
    const wrapTx = await signer.sendTransaction({
        to: process.env.APECHAIN_WAPE,
        value: amount
    });
    await wrapTx.wait();

    console.log(`Successfully wrapped ${ethers.formatEther(amount)} APE to WAPE`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

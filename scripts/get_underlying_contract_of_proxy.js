const { ethers } = require("hardhat");

async function main() {
    const [signer] = await ethers.getSigners();
    
    // First, let's get the implementation address
    const implementationSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
    const implementation = await ethers.provider.getStorage(
        process.env.APECHAIN_WAPE, 
        implementationSlot
    );
    const implementationAddress = ethers.getAddress("0x" + implementation.slice(-40));
    console.log("Implementation address:", implementationAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
const { ethers } = require("ethers");
require('dotenv').config();

async function checkWrapFunctionExists() {
    const wapeContractAddress = process.env.APECHAIN_WAPE;
    const provider = new ethers.JsonRpcProvider("https://apechain.calderachain.xyz");
  
    try {
      const code = await provider.getCode(wapeContractAddress);
      
      if (code === "0x") {
        console.error("Contract not found at this address.");
        return;
      }
      
      const functionSignature = ethers.id("unwrap(uint256)").slice(0, 10);
      console.log("Function signature:", functionSignature);
    } catch (error) {
      console.error("Could not verify wrap function:", error);
    }
  }
  
  checkWrapFunctionExists();
  
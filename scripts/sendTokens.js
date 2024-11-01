// Replace imports with require statements
const { ethers } = require("hardhat");
const { addressToBytes32, Options } = require('@layerzerolabs/lz-v2-utilities');
const fs = require('fs');

require("dotenv").config();

/**
 * @typedef {Object} SendParam
 * @property {number} dstEid
 * @property {string} to
 * @property {string|number} amountLD
 * @property {string|number} minAmountLD
 * @property {string} extraOptions
 * @property {string} composeMsg
 * @property {string} oftCmd
 */

// Load ABI
const apeAbi = JSON.parse(fs.readFileSync('abis/ape_arbitrum.json'));

async function main() {
    const toAddress = process.env.ADDRESS_MAIN;
    const eidB = 30312;
    const amount = "1.0";

    const [signer] = await ethers.getSigners();
    
    const oft = new ethers.Contract(
        process.env.ARBITRUM_APE,
        apeAbi,
        signer
    );

    const decimals = await oft.decimals();
    const parsedAmount = ethers.parseUnits(amount, decimals);
    const options = Options.newOptions().addExecutorLzReceiveOption(10000, 0).toBytes();

    const sendParam = {
        dstEid: eidB,
        to: addressToBytes32(toAddress),
        amountLD: parsedAmount,
        minAmountLD: parsedAmount,
        extraOptions: options,
        composeMsg: ethers.getBytes('0x'),
        oftCmd: ethers.getBytes('0x'),
    };

  // Get the quote for the send operation
  const feeQuote = await oft.quoteSend(sendParam, false);
  const nativeFee = feeQuote.nativeFee;

  console.log(
    `sending ${amount} token(s) to network ${eidB} (${eidB})`
  );

  const tx = await oft.send(
    sendParam,
    { nativeFee: nativeFee, lzTokenFee: 0 },
    signer.address,
    { value: nativeFee }
  );

  console.log(`Send tx initiated. See: https://layerzeroscan.com/tx/${tx.hash}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
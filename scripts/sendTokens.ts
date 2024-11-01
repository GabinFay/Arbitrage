import { ethers } from "hardhat";
import { getNetworkNameForEid } from '@layerzerolabs/devtools-evm-hardhat';
import { EndpointId } from '@layerzerolabs/lz-definitions';
import { addressToBytes32, Options } from '@layerzerolabs/lz-v2-utilities';
import { BigNumberish, BytesLike } from 'ethers';
import fs from 'fs';

require("dotenv").config();


interface SendParam {
  dstEid: EndpointId;
  to: BytesLike;
  amountLD: BigNumberish;
  minAmountLD: BigNumberish;
  extraOptions: BytesLike;
  composeMsg: BytesLike;
  oftCmd: BytesLike;
}

// Add ABI loading
const apeAbi = JSON.parse(fs.readFileSync('json/ape_arbitrum.json'));

async function main() {
  // Replace hardcoded values with env variables
  const toAddress = process.env.ADDRESS_MAIN;
  const eidB = 30312; // Keeping this as is since it's a network identifier
  const amount = "1.0"; // Keeping this as is since it's a test amount

  const [signer] = await ethers.getSigners();
  
  // Replace contract initialization to use ABI and address from env
  const oft = new ethers.Contract(
    process.env.ARBITRUM_APE, // Using APE token address from env
    apeAbi,
    signer
  );

  const decimals = await oft.decimals();
  const parsedAmount = ethers.parseUnits(amount, decimals);
  const options = Options.newOptions().addExecutorLzReceiveOption(65000, 0).toBytes();

  const sendParam: SendParam = {
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
    `sending ${amount} token(s) to network ${getNetworkNameForEid(eidB)} (${eidB})`
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
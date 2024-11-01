// Import necessary libraries
const { ethers } = require('hardhat');
const fs = require('fs');

// Load the ABI from json/ape_arbitrum.json
const apeAbi = JSON.parse(fs.readFileSync('json/ape_arbitrum.json'));

// Set up the required variables
const APE_ARBITRUM_ADDRESS = process.env.APE_ARBITRUM_ADDRESS

// '0x7f9fbf9bdd3f4105c478b996b648fe6e828a1e98';
const DEST_CHAIN_ID = 30312; // ApeChain lz eid

async function sendApeToApeChain(recipientAddress, amount) {
  // Initialize the Apecoin contract on Arbitrum
  const apeContract = new ethers.Contract(APE_ARBITRUM_ADDRESS, apeAbi, ethers.provider.getSigner());

  // Convert recipient address to bytes32
  const toAddressBytes32 = ethers.utils.hexZeroPad(recipientAddress, 32);

  // Create SendParam struct
  const sendParam = {
    dstEid: DEST_CHAIN_ID,
    to: toAddressBytes32,
    amountLD: ethers.utils.parseUnits(amount.toString(), 18),
    minAmountLD: ethers.utils.parseUnits(amount.toString(), 18),
    extraOptions: '0x',  // No extra options
    composeMsg: '0x',    // No composed message
    oftCmd: '0x'         // No OFT command
  };

  try {
    // Get the fee quote first
    const feeQuote = await apeContract.quoteSend(sendParam, false);
    const nativeFee = feeQuote.nativeFee;

    // Create MessagingFee struct
    const messagingFee = {
      nativeFee: nativeFee,
      lzTokenFee: 0
    };

    // Get refund address (sender's address)
    const refundAddress = await ethers.provider.getSigner().getAddress();

    // Send the transaction
    const tx = await apeContract.send(
      sendParam,
      messagingFee,
      refundAddress,
      { value: nativeFee }
    );

    console.log('Transaction sent. Waiting for confirmation...');
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt.transactionHash);
  } catch (error) {
    console.error('Error sending APE:', error);
  }
}

// Call the function
const recipient = '0xe4103e80c967f58591a1d7ca443ed7e392fed862'; // Replace with actual recipient address on ApeChain
const amountToSend = 10; // Replace with the amount you want to send
sendApeToApeChain(recipient, amountToSend);
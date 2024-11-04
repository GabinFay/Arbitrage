
const ethers = require('ethers');
require('dotenv').config();
const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json').abi;
const IUniswapV3FactoryABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json').abi;
const ISwapRouterABI = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json').abi;
const IWETH9ABI = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/external/IWETH9.sol/IWETH9.json').abi;

const LINK_ADDRESS = '0xE4aB69C077896252FAFBD49EFD26B5D171A32410';
const WETH_ADDRESS = '0x4200000000000000000000000000000000000006';
const UNISWAP_FACTORY_ADDRESS = '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865';
const UNISWAP_ROUTER_ADDRESS = '0x2626664c2603336E57B271c5C0b26F421741e481';

const provider = new ethers.providers.JsonRpcProvider('https://sepolia.base.org');
const privateKey = process.env.PRIVATE_KEY_MAIN;

const wallet = new ethers.Wallet(privateKey, provider);

// ... (rest of the code will follow)

async function checkPoolLiquidity() {
    const factory = new ethers.Contract(UNISWAP_FACTORY_ADDRESS, IUniswapV3FactoryABI, wallet);
    const poolAddress = await factory.getPool(LINK_ADDRESS, WETH_ADDRESS, 3000); // Assuming 0.3% fee tier

    if (poolAddress === ethers.constants.AddressZero) {
        console.log('Pool does not exist');
        return false;
    }

    const pool = new ethers.Contract(poolAddress, IUniswapV3PoolABI, wallet);
    const { liquidity } = await pool.slot0();

    console.log(`Pool liquidity: ${liquidity.toString()}`);
    return liquidity.gt(0);
}
async function swapLINKForWETH(amountIn) {
    const router = new ethers.Contract(UNISWAP_ROUTER_ADDRESS, ISwapRouterABI, wallet);
    const linkContract = new ethers.Contract(LINK_ADDRESS, ['function approve(address spender, uint256 amount) public returns (bool)'], wallet);

    // Approve the router to spend LINK
    await linkContract.approve(UNISWAP_ROUTER_ADDRESS, amountIn);

    const params = {
        tokenIn: LINK_ADDRESS,
        tokenOut: WETH_ADDRESS,
        fee: 3000, // 0.3%
        recipient: wallet.address,
        deadline: Math.floor(Date.now() / 1000) + 60 * 10, // 10 minutes from now
        amountIn: amountIn,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
    };

    const tx = await router.exactInputSingle(params);
    const receipt = await tx.wait();
    console.log(`Swap transaction hash: ${receipt.transactionHash}`);
}

// ... (continued in the next part)
// ... (continued in the next part)

async function unwrapWETH(amount) {
    const weth = new ethers.Contract(WETH_ADDRESS, IWETH9ABI, wallet);
    const tx = await weth.withdraw(amount);
    const receipt = await tx.wait();
    console.log(`Unwrap transaction hash: ${receipt.transactionHash}`);
}

// Main function to execute all steps
async function main() {
    const hasLiquidity = await checkPoolLiquidity();
    if (!hasLiquidity) {
        console.log('Insufficient liquidity in the pool');
        return;
    }

    const linkAmount = ethers.utils.parseUnits('25', 18); // 25 LINK tokens
    await swapLINKForWETH(linkAmount);

    // Get WETH balance after swap
    const weth = new ethers.Contract(WETH_ADDRESS, IWETH9ABI, wallet);
    const wethBalance = await weth.balanceOf(wallet.address);
    console.log(`WETH balance after swap: ${ethers.utils.formatEther(wethBalance)} WETH`);

    // Unwrap all WETH to ETH
    await unwrapWETH(wethBalance);

    const ethBalance = await provider.getBalance(wallet.address);
    console.log(`Final ETH balance: ${ethers.utils.formatEther(ethBalance)} ETH`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
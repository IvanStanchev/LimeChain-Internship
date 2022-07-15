const hre = require("hardhat");
const { ethers } = require("ethers");
const LimeToken = require("./../artifacts/contracts/LimeToken.sol/LimeToken.json");
const privateKey1 = process.env.PRIVATE_KEY;
const publicKey1 = process.env.PUBLIC_KEY;
const infuraKey = process.env.ETERSCAN_API_KEY;
const contractAddr = "0xd5f57579427d934356716B474649cEcAd75E08f8";

const publicKey2 = "0x465b2b6CC578268BA33f24A7e151D144b0E44D29";


const run = async function() {
    const provider = new hre.ethers.providers.InfuraProvider("ropsten", infuraKey)
    const wallet = new hre.ethers.Wallet(privateKey1, provider);
	const balance = await wallet.getBalance();
    const limeTokenContract = new hre.ethers.Contract(contractAddr, LimeToken.abi, wallet);

    const mintTx = await limeTokenContract.mint(publicKey1, "2000000000000000000");
    await mintTx.wait();

    console.log("Deployer has ", await limeTokenContract.balanceOf(publicKey1), " LMT");

    const transfetrTx = await limeTokenContract.transfer(publicKey2, "1430000000000000000");
    await transfetrTx.wait();

    console.log("Receiver has ", await limeTokenContract.balanceOf(publicKey2), " LMT");
    console.log("Deployer has ", await limeTokenContract.balanceOf(publicKey1), " LMT");
    
    const burnTx = await limeTokenContract.burn(Balance1);
    await burnTx.wait()
    console.log("Deployer has ", await limeTokenContract.balanceOf(publicKey1), " LMT");
}

run()
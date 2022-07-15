const { ethers } = require("ethers");
const ETHWrapper = require('./../artifacts/contracts/ETHWrapper.sol/ETHWrapper.json');
const WETH = require('./../artifacts/contracts/WETH.sol/WETH.json');

const run = async function() {

	const providerURL = "http://localhost:8545";
	const walletPrivateKey = "0xde9be858da4a475276426320d5e9262ecfc3ba460bfac56360bfa6c4c28b4ee0";
	const wrapperContractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const provider = new ethers.providers.JsonRpcProvider(providerURL)
	const wallet = new ethers.Wallet(walletPrivateKey, provider)

	const wrapperContract = new ethers.Contract(wrapperContractAddress, ETHWrapper.abi, wallet)
	const wethAddress = await wrapperContract.WETHToken();
    const tokenContract = new ethers.Contract(wethAddress, WETH.abi, wallet)
	
    const wrapValue = ethers.utils.parseEther("1")

	// const wrapTx = await wrapperContract.wrap({value: wrapValue})
    const wrapTx = await wallet.sendTransaction({ to: wrapperContractAddress, value: wrapValue})
	await wrapTx.wait();

	let balance = await tokenContract.balanceOf(wallet.address)
	console.log("Balance after wrapping:", balance.toString())

	let contractETHBalance = await provider.getBalance(wrapperContractAddress);
	console.log("Contract ETH balance after wrapping:", contractETHBalance.toString())
    
    const approveTX = await tokenContract.approve(wrapperContractAddress, wrapValue)
    await approveTX.wait()

    const unwrapTX = await wrapperContract.unwrap(wrapValue)
    await unwrapTX.wait()

    balance = await tokenContract.balanceOf(wallet.address)
    console.log("Balance after unwrapping: ", balance.toString())

    contractETHBalance - await provider.getBalance(wrapperContractAddress);
    console.log("Contract ETH balance after unwrapping: ", contractETHBalance.toString())
    
}

run()
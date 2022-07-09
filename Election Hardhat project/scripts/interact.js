const hre = require("hardhat");
const USElection = require('./../artifacts/contracts/Election.sol/USElection.json')

const run = async function() {
		const provider = new hre.ethers.providers.InfuraProvider("ropsten", "40c2813049e44ec79cb4d7e0d18de173")
		
		const wallet = new hre.ethers.Wallet("d9c7740f303fe5ede2e6f730bdcc382aec0c9e3dda25058c0ded5c1810f504dc", provider)
		const balance = await wallet.getBalance();
	
		const electionContract = new hre.ethers.Contract("0xF090551DEA62866c127eaF710f7dd839377C926d", USElection.abi, wallet)
	
	const transactionOhio = await electionContract.submitStateResult(["Ohio", 250, 150, 24]);
	console.log("State Result Submission Transaction:", transactionOhio.hash);
	const transactionReceipt = await transactionOhio.wait();
	if (transactionReceipt.status != 1) {
		console.log("Transaction was not successfull")
		return 
	}

	const resultsSubmittedOhioNew = await electionContract.resultsSubmitted("Ohio")
	console.log("Results submitted for Ohio", resultsSubmittedOhioNew);

	const currentLeader = await electionContract.currentLeader();
	console.log("Current leader", currentLeader);
}

run()



// const wallet = new hre.ethers.Wallet("0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e", provider)
// const balance = await wallet.getBalance();

// const electionContract = new hre.ethers.Contract("0xF090551DEA62866c127eaF710f7dd839377C926d", USElection.abi, wallet)
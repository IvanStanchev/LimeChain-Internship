const { task } = require("hardhat/config");

require('dotenv').config();
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("solidity-coverage");


task("deploy", "Deploys the contract", async (takeArgs, hre) => {
	const LimeToken = await hre.ethers.getContractFactory("LimeToken");
	const lime = await LimeToken.deploy();

	await lime.deployed();
	console.log("LimeCoin deployed to: ", lime.address);

});

const privateKey1 = process.env.PRIVATE_KEY;
const infuraId = process.env.ETERSCAN_API_KEY

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
	solidity: {
		compilers: [
		{
			version: "0.6.4",
			settings: {
				optimizer: {
				  enabled: true,
				  runs: 200,
				},
			},
		},
		{
			version: "0.7.4",
			settings: {
				optimizer: {
				  enabled: true,
				  runs: 200,
				},
			},
		},
		],
	},

	networks: {
		ropsten: {
			url: `https://ropsten.infura.io/v3/${infuraId}`,
			accounts: [privateKey1],
		},
	},

	paths: {
		sources: "./contracts",
		tests: "./test",
		cache: "./cache",
		artifacts: "./artifacts",
	},

	mocha: {
		timeout: 20000,
	},
};



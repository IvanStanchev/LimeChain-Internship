const { task } = require('hardhat/config');

require('dotenv').config();
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("solidity-coverage");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("deploy", "Deploys contract on a provided network")
.setAction(async (taskArguments, hre, runSuper) => {
  const deployLibrary = require("./scripts/deploy");
  await deployLibrary(taskArguments);
})

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

const privatekey1 = process.env.PRIVATE_KEY;
const etherscanKey = process.env.ETHERSCAN_API_KEY; 

module.exports = {
  solidity: { 
    version: "0.8.7",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  networks: {
    ropsten: {
      url: 'https://ropsten.infura.io/v3/e758deae24994488a643fb8d88b21898',
      accounts: [privatekey1],
    },
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },

  mocha: {
    timeout : 20000,
  },

};



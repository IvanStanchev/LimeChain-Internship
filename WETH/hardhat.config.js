require("@nomiclabs/hardhat-waffle");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("deploy", "Deploys the ETHWrapper contract", async (taskArgs, hre) => {
    const ETHWrapper = await ethers.getContractFactory("ETHWrapper"); // 
    const ethWrapperContract = await ETHWrapper.deploy();
    console.log('Waiting for ETHWrapper deployment...');
    await ethWrapperContract.deployed();
    console.log("ETHWrapper deployed to: ", ethWrapperContract.address);

});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
 module.exports = {
  solidity: {
    version: "0.7.5",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};

//npx hardhat run --network localhost scripts/sample-script.js
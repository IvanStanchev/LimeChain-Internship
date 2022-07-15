const { getContractFactory } = require("@nomiclabs/hardhat-ethers/types");
const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const LIB = require('./../artifacts/contracts/LIB.sol/LIB.json');

describe("library-wrap", function () {   
    let libraryFactory;
    let library;
    let deployer;
    let wrapValue;
    let libTokenAddress;
    let libToken;

    beforeEach(async () => {
        libraryFactory = await ethers.getContractFactory("Library");
        library = await libraryFactory.deploy();
        await library.deployed();

        [ deployer ] = await ethers.getSigners();
        
        libTokenAddress = await library.LIBToken();

        libToken = await new ethers.Contract(libTokenAddress, LIB.abi, deployer);
        await libToken.deployed();

        wrapValue = ethers.utils.parseEther("1");
    });

    it("Should revert if calling 'wrap' with no wei ", async () => {
        await expect(library.wrap())
        .to.be.revertedWith("We need to wrap at least 1 wei");
    });

    it("Should revert if calling 'unwrap' with no wei ", async () => {
        await expect(library.unwrap(0))
        .to.be.revertedWith("We need to unwrap at least 1 wei");
    });

    it("Should be able to activate wrap() by receive() when sending a transaction", async () => {
        const wrapTx = await deployer.sendTransaction({to: library.address, value: wrapValue});
        await wrapTx.wait();

        const ownerBalance = await libToken.balanceOf(deployer.address);
        const total = await libToken.totalSupply();

        await expect(total)
        .to.equal(ownerBalance);
    });

    it("Should wrap wei into LIB token and emit sender and value", async () => {
        await expect (deployer.sendTransaction({to: library.address, value: wrapValue}))
        .to.emit(library, "LogLIBWrapped")
        .withArgs(deployer.address, wrapValue);
    });
        
    it("Should have equal values for owner balance and total", async () => {    
        const wrapTx = await deployer.sendTransaction({to: library.address, value: wrapValue});
        await wrapTx.wait();

        const ownerBalance = await libToken.balanceOf(deployer.address);
        const total = await libToken.totalSupply();
        
        await expect(total)
        .to.equal(ownerBalance);
    });
    
    it("Should be able to unwrap tokens and emit message with sender and value", async () => {
        const wrapTx = await library.wrap({value: wrapValue})
        await wrapTx.wait();

        const approveTX = await libToken.approve(await library.address, await wrapValue)
        await approveTX.wait()
    
        await expect(library.unwrap(wrapValue))
        .to.emit(library, "LogLIBUnwrapped")
        .withArgs(deployer.address, wrapValue);
    });

    it("Should have 1/2 ETH after wrapping 1 and unwrapping a half", async () => {
        const wrapTx = await library.wrap({value: wrapValue})
        await wrapTx.wait();

        const approveTX = await libToken.approve(await library.address, await wrapValue)
        await approveTX.wait()
    
        const unwrapTX = await library.unwrap("500000000000000000");
        await unwrapTX.wait();
        const balance = await libToken.balanceOf(deployer.address);
        
        await expect((balance.toString()))
        .to.equal("500000000000000000");
    });

    it("Should not be able to unwrap without approval", async () => {
        const wrapTx = await library.wrap({value: wrapValue})
        await wrapTx.wait();
        await expect(library.unwrap(wrapValue))
        .to.be.revertedWith("ERC20: transfer amount exceeds allowance");
    })

    it("Should revert with 'Not enough LIB' if you try to rent a book and have less than 0.1 LIB", async () => {
        const add = await library.addBook("Borrowed", 5, 1);
        await add.wait();

        await expect (library.borrowBook(5))
        .to.be.revertedWith("Not enough LIB");
    });

});

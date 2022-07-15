const { expect, assert } = require("chai");
const { getContractAddress } = require("ethers/lib/utils");
const { ethers } = require("hardhat")
const LIB = require('./../artifacts/contracts/LIB.sol/LIB.json');

describe("Library", function () {   
    let libraryFactory;
    let library;

    beforeEach(async () => {
        libraryFactory = await ethers.getContractFactory("Library");
        library = await libraryFactory.deploy();
        await library.deployed();

        [ deployer ] = await ethers.getSigners();
        libTokenAddress = await library.LIBToken();
        libToken = await new ethers.Contract(libTokenAddress, LIB.abi, deployer);
        await libToken.deployed();
        wrapValue = ethers.utils.parseEther("1");
        const wrapTx = await deployer.sendTransaction({to: library.address, value: wrapValue});
        await wrapTx.wait();

        const approveTX = await libToken.approve(await library.address, await wrapValue)
        await approveTX.wait()
    });

    it("Should not have book ids before a book had been added", async () => {
      await expect(library.getAllBookIds().length)
      .to.equal(undefined);
    });

    it("Should add a book and emit an event with its name and the number of copies", async () =>  {
      await expect(library.addBook("New book", 4, 1))
      .to.emit(library, "AddedBook")
      .withArgs("New book", 1)      
    });

    it("Should revert if you try to add book with registerd id and different name", async () => {
      await library.addBook("Bible", 0, 1);
      await expect( library.addBook("Not Bible", 0, 1))
      .to.be.revertedWith("Book with this id has different name");
    })

    it("Should be able to add books with registered name if they have different name", async () => {
      await library.addBook("Bible", 0, 1);
      await expect(library.addBook("Bible", 100, 1))
      .to.emit(library, "AddedBook")
      .withArgs("Bible", 1);
    })

    it("Should have one book", async () => {
      await library.addBook("New book", 4, 1);
      const ids = await library.getAllBookIds();
      await expect(ids.length)
      .to.equal(1);
    });

    it("First book id has to be the id of first book added", async () => {
      await library.addBook("First added book", 14, 1);
      const ids = await library.getAllBookIds();
      await expect(ids[0])
      .to.equal(14);
    })
    

    it("Should add a second copy of a book if it was added and emit an event with the name and the number of copies", async () => {
      await library.addBook("New book", 4, 1)
      await expect(library.addBook("New book", 4, 6))
      .to.emit(library, "AddedCopies")
      .withArgs("New book", 6)
    });

    it("Should not be able to add book if not owner", async () =>  {
      const [owner, addr1] = await ethers.getSigners();
      await expect(library.connect(addr1).addBook("Book", 3, 3)).to.be.revertedWith('Ownable: caller is not the owner');
    });    

    it("Should rent a book to a user and emit event with the address of the user and the book name", async () => {
      const add = await library.addBook("Borrowed", 5, 1);
      await expect(library.borrowBook(5))
      .to.emit(library, "BorrowBook")
      .withArgs(deployer.address, "Borrowed")
    });

    it("Should NOT rent a book if it is not in the library and revert", async () => {
      await expect(library.borrowBook(5))
      .to.be.revertedWith("Not available");
    })

    it("Should be able to return a book and emit event with the address of the user and the book name", async () => {
      const add = await library.addBook("Borrowed", 5, 1);
      const borrow = await library.borrowBook(5);
      await expect(library.returnBook(5))
      .to.emit(library, "ReturnBook")
      .withArgs(deployer.address, "Borrowed");
    } )

    it("Should NOT be able to return book if it was not taken", async () => {
      await expect(library.returnBook(5))
      .to.be.revertedWith("Not taken");
    })


   
});

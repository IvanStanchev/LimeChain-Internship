const { expect, assert } = require("chai");
const { ethers } = require("hardhat")

describe("Library", function () {   
    let libraryFactory;
    let library;

    before(async () => {
        libraryFactory = await ethers.getContractFactory("Library");
        library = await libraryFactory.deploy();
        await library.deployed();
    });

    it("Should revert if there are not any books ", async function(){
      await expect(library.getAllBookIds())
      .to.be.revertedWith("There are no books");
    })

    it("Should add a book and emit an event with its name and the number of copies", async function () {
      await expect(library.addBook("New book", 4, 1))
      .to.emit(library, "AddedBook")
      .withArgs("New book", 1)      
    });

    it("Should add a second copy of the added book and emit an event with the name and the number of copies", async function(){
      await expect(library.addBook("New book", 4, 6))
      .to.emit(library, "AddedCopies")
      .withArgs("New book", 6)
    });

    it("Should not be able to add book if not owner", async function () {
      const [owner, addr1] = await ethers.getSigners();
      await expect(library.connect(addr1).addBook("Book", 3, 3)).to.be.revertedWith('Ownable: caller is not the owner');
    });    

    it("Should rent a book to a user and emit event with the address of the user and the book name", async function(){
      const add = await library.addBook("Borrowed", 5, 1);
      await expect(library.borrowBook(5))
      .to.emit(library, "BorrowBook")
      .withArgs("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "Borrowed")
    });

    it("Should NOT rent a book if it is not in the library and revert", async function(){
      await expect(library.borrowBook(5))
      .to.be.revertedWith("Not available");
    })

    it("Should be able to return a book and emit event with the address of the user and the book name", async function(){
      const add = await library.addBook("Borrowed", 5, 1);
      const borrow = await library.borrowBook(5);
      await expect(library.returnBook(5))
      .to.emit(library, "ReturnBook")
      .withArgs("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "Borrowed");
    } )

    it("Should NOT be able to return book if it was not taken", async function(){
      await expect(library.returnBook(5))
      .to.be.revertedWith("Not taken");
    })

    it("Should have only one user in this test case", async function(){
      const users = await library.returnAllUsers();
      await expect(users.length)
      .to.equal(1);
    } )

    
     
});

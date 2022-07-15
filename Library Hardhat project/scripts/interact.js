const { id } = require("ethers/lib/utils")
const hre = require("hardhat")
const Library = require("./../artifacts/contracts/Library.sol/Library.json")

const publicKey1 = process.env.PUBLIC_KEY
const privateKey1 = process.env.PRIVATE_KEY
const infuraKey = process.env.ETERSCAN_API_KEY

const run = async function(){
    const provider = new hre.ethers.providers.InfuraProvider("ropsten", infuraKey)
    
    const wallet = new hre.ethers.Wallet(privateKey1, provider)
    const balance = await wallet.getBalance();
    const libraryContract = new hre.ethers.Contract("0x241dEeB80b4FDb72c2aC6d5142873e134cDF9570", Library.abi, wallet)
    // console.log(libraryContract)

    const bookId = 43;
    
    // //CREATES A BOOK
    const bookAdded = await libraryContract.addBook("A Book", bookId, 1);
    console.log("Book added: ", bookAdded.hash);

    //SHOWS ALL AVAILABLE BOOKS
    const allBookIds = await libraryContract.getAllBookIds();
    console.log("First id: ", allBookIds[0])
    for(let i = 0; i < allBookIds.length; i++)
    {
        const current = await libraryContract.books(allBookIds[i]);
        if(current.copies != 0){
            console.log("\nBook with id ", (current).toString() , " : [\n  name: ", current.name, "\n  copies: ", current.copies.toString(), "\n]" )
        }
    }

    //RENTS A BOOK
    const rented = await libraryContract.borrowBook(bookId);
    console.log("Rent transaction: ", rented.hash);
    
    //CHECKS THAT IT IS RENTED
    const checkRented = await libraryContract.borrowedBooks(publicKey1, bookId);
    console.log("Rented: ", checkRented);
    
    // //RETURNS THE BOOK
    const returned = libraryContract.returnBook(bookId);
    console.log("Returned book transaction: ", returned.hash);

    // //SHOW BOOK BY ID
    const showById = await libraryContract.books(4);
    console.log("\nBook with id ", 4 , " : [\n  name: ", showById.name, "\n  copies: ", showById.copies.toString(), "\n]" )   
}


run()
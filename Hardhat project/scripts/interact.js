const hre = require("hardhat")
const Library = require("./../artifacts/contracts/Library.sol/Library.json")

const publicKey1 = process.env.PUBLIC_KEY
const privateKey1 = process.env.PRIVATE_KEY
const infuraKey = process.env.ETERSCAN_API_KEY

const run = async function(){
    const provider = new hre.ethers.providers.InfuraProvider("ropsten", infuraKey)
    
    const wallet = new hre.ethers.Wallet(privateKey1, provider)
    const balance = await wallet.getBalance();
    
    const libraryContract = new hre.ethers.Contract("0xf05307770a1f062BD923f4dA4f554C4b9F576d3d", Library.abi, wallet)
    console.log(libraryContract)

    const bookId = 43;
    
    // //CREATES A BOOK
    const bookAdded = await libraryContract.addBook("A Book", bookId, 1);
    console.log("Book added: ", bookAdded);

    //SHOWS ALL AVAILABLE BOOKS
    const allBookIds = await libraryContract.getAllBookIds();
    for(let i = 0; i < allBookIds.length; i++)
    {
        const current = await libraryContract.books(allBookIds[i]);
        if(current.copies != 0){
            console.log("\nBook with id ", (allBookIds[i]).toString() , " : [\n  name: ", current.name, "\n  copies: ", current.copies.toString(), "\n]" )
        }
    } 

    // //RENTS A BOOK
    const rented = await libraryContract.borrowBook(bookId);
    console.log("Rent transaction: ", rented.hash);
    
    // //CHECKS IF RENTED
    const usersAddrs = await libraryContract.returnAllUsers();
    console.log("USERS: ", usersAddrs)
    check = false;
    for(let i = 0; i < usersAddrs.length; i++)
    {
        const borrowed = await libraryContract.borrowedBooks(usersAddrs[i], bookId);
        if(borrowed)
        {
            check = true;
            break;
        }
    }
    if(check){
        console.log("This book is borrowed");
    }
    else{
        console.log("This book is NOT borrowed");
    }
    
    // //RETURNS THE BOOK
    const returned = libraryContract.returnBook(bookId);
    console.log("Returned book transaction: ", returned.hash);

    // //SHOW BOOK BY ID
    const showById = await libraryContract.books(bookId);
    console.log("\nBook with id ", bookId , " : [\n  name: ", showById.name, "\n  copies: ", showById.copies.toString(), "\n]" )
    
    
}


run()
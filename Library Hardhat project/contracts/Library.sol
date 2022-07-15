//SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./LIB.sol";

contract Library is Ownable{
    event AddedBook(string name, uint copies);
    event AddedCopies(string name, uint copies);
    event BorrowBook(address user, string name);
    event ReturnBook(address user, string name);
    event LogLIBWrapped(address sender, uint256 amount);
	event LogLIBUnwrapped(address sender, uint256 amount);

    struct Book{
        string name;
        uint copies;
        address[] borrowers;
    }

    LIB public LIBToken;

    mapping(address => mapping(uint => bool)) public borrowedBooks;
    mapping(address => bool) public userRegistered;
    mapping(uint => Book) public books;
    uint[] public allBookIds; 
    uint256 public immutable FEE = 100000000000000000; 
    
    
    constructor() Ownable() {
        LIBToken = new LIB();
    }
    
    receive() external payable{
        wrap();
    }

    function wrap() public payable {
		require(msg.value > 0, "We need to wrap at least 1 wei");
		LIBToken.mint(msg.sender, msg.value);
		emit LogLIBWrapped(msg.sender, msg.value);
	}

	function unwrap(uint value) external payable onlyOwner {
		require(value > 0, "We need to unwrap at least 1 wei");
		LIBToken.transferFrom(msg.sender, address(this), value);
		LIBToken.burn(value);
		msg.sender.transfer(value);
		emit LogLIBUnwrapped(msg.sender, value);
	}

    function addBook(string calldata _name, uint _id, uint _copies) external onlyOwner{
        Book storage book = books[_id];
        if((book.copies == 0) && (bytes(book.name).length == 0))
        {
            book.name = _name;
            book.copies = _copies;
            allBookIds.push(_id);
            emit AddedBook(_name, _copies);
        }
        else if((bytes(book.name).length != 0) && (keccak256(bytes(book.name)) != keccak256(bytes(_name))))
        {
            revert("Book with this id has different name");
        }   
        else
        {
            book.copies += _copies;
            emit AddedCopies(_name, _copies);
        }
    }
    function getAllBookIds() public view returns (uint[] memory){
        require(allBookIds.length != 0, "There are no books");
        return(allBookIds);
    }

    function borrowBook(uint _id) external {
        Book storage book = books[_id];
        require(book.copies != 0, "Not available");
        require(LIBToken.balanceOf(msg.sender) >= FEE, "Not enough LIB");
        
        LIBToken.transferFrom(msg.sender, address(this), FEE);
        book.borrowers.push(msg.sender);
        
        if(!borrowedBooks[msg.sender][_id])
        {
            borrowedBooks[msg.sender][_id] = true;
        }
        
        book.copies-- ;
        emit BorrowBook(msg.sender, book.name);
    }
    
    function returnBook(uint _id) external {
        require(borrowedBooks[msg.sender][_id], "Not taken"); 
        borrowedBooks[msg.sender][_id] = false;

        Book storage book = books[_id];
        book.copies++;
        emit ReturnBook(msg.sender, book.name);
    }
}

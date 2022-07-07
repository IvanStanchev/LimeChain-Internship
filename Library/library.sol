//SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

contract Library{
    event AddedBook(string name, uint copies);
    event AddedCopies(string name, uint copies);
    event BorrowBook(address user, string name);
    event ReturnBook(address user, string name);

    struct Book{
        string name;
        uint copies;
    }

    address public owner;
    address[] public users;

    mapping(address => mapping(uint => bool)) public borrowedBooks;
    mapping(address => bool) public userRegistered;
    mapping(uint => Book) public books;
    
    constructor(address _owner){
        owner = _owner;
    }
    
    function addBook(string calldata _name, uint _id, uint _copies) external {
        require(msg.sender == owner, "Not owner");
        Book storage book = books[_id];
        if(books[_id].copies == 0)
        {
            book.name = _name;
            book.copies = _copies;
            emit AddedBook(_name, _copies);
        }   
        else
        {
            book.copies += _copies;
            emit AddedCopies(_name, _copies);
        }
    }

    function borrowBook(uint _id) external {
        Book storage book = books[_id];
        require(book.copies != 0, "Not available");
        
        if(!userRegistered[msg.sender])
        {    
            userRegistered[msg.sender] = true;
            users.push(msg.sender);
        }
        
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

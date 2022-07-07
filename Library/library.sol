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

    mapping(address => uint[]) public borrowedBooks;
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

    modifier checkIfBorrowed(uint _id)
    {
        uint[] memory _arr = borrowedBooks[msg.sender]; 
        for(uint i; i< _arr.length; i++)
        {
            if(_arr[i] == _id)
            {
                revert("Not borrowed");
            }
        }
        _;
    }

    function borrowBook(uint _id) external checkIfBorrowed(_id) {
        Book storage book = books[_id];
        require(book.copies != 0, "Not available");
        
        if(!userRegistered[msg.sender])
        {    
            userRegistered[msg.sender] = true;
            users.push(msg.sender);
        }
        uint[] storage arr = borrowedBooks[msg.sender];
        
        arr.push(_id);
        book.copies -= 1;
        emit BorrowBook(msg.sender, book.name);
    }
    
    function returnBook(uint _id) external checkIfBorrowed(_id) {
        uint i;
        uint[] storage arr = borrowedBooks[msg.sender];
        while(i < arr.length) 
        {
            if(arr[i] == _id)
            {
                borrowedBooks[msg.sender][i] = 0;
                break;
            }
            i++;
        }
        Book storage book = books[_id];
        book.copies++;
        emit ReturnBook(msg.sender, book.name);
    }
}

import * as React from 'react';
import styled from 'styled-components';

import Web3Modal from 'web3modal';
// @ts-ignore
import WalletConnectProvider from '@walletconnect/web3-provider';
import Column from './components/Column';
import Wrapper from './components/Wrapper';
import Header from './components/Header';
import Loader from './components/Loader';
import ConnectButton from './components/ConnectButton';
import Button from './components/Button';
import './App.css';

import { Web3Provider } from '@ethersproject/providers';
import { getChainData } from './helpers/utilities';
import { LIBRARY_CONTRACT_ADDRESS } from './constants';
import { getContract } from './helpers/ethers';
import Library from './constants/abis/Library.json';
import LIB from './constants/abis/LIB.json';
import { utils } from 'ethers';



const SLayout = styled.div`
  position: relative;
  width: 100%;
  min-height: 100vh;
  text-align: center;
`;

const SContent = styled(Wrapper)`
  width: 100%;
  height: 100%;
  padding: 0 16px;
`;

const SContainer = styled.div`
  height: 100%;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  word-break: break-word;
`;

const SLanding = styled(Column)`
  height: 600px;
`;

// @ts-ignore
const SBalances = styled(SLanding)`
  height: 100%;
  & h3 {
    padding-top: 30px;
  }
`;

interface IAppState {
  fetching: boolean;
  address: string;
  library: any;
  connected: boolean;
  chainId: number;
  pendingRequest: boolean;
  result: any | null;
  libraryContract: any | null;
  libTokenContract: any | null;
  libToken: any | null;
  userBalance: any;
  libraryLIBBalance: any | null;
  libraryETHBalance: any | null;
  info: any | null;
  transactionHash: string | null;
  allBooks: Array<[]> | null;
  allBookIds: Array<[]> | null;
  bookName: string | any;
  bookId: string | any;
  bookCopies: string | any;
  error: string | any;
  ownerAddress: string | null;
}

const INITIAL_STATE: IAppState = {
  fetching: false,
  address: '',
  library: null,
  connected: false,
  chainId: 1,
  pendingRequest: false,
  result: null,
  libraryContract: null,
  libTokenContract: null,
  libToken: null,
  userBalance: null,
  libraryLIBBalance: null,
  libraryETHBalance: null,
  info: null,
  transactionHash: null,
  allBooks: null || [],
  allBookIds: null || [],
  bookName: null,
  bookId: null,
  bookCopies: null,
  error: null,
  ownerAddress: null,
  
};

class App extends React.Component<any, any> {
  // @ts-ignore
  public web3Modal: Web3Modal;
  public state: IAppState;
  public provider: any;

  constructor(props: any) {
    super(props);
    this.state = {
      ...INITIAL_STATE
    };

    this.web3Modal = new Web3Modal({
      network: this.getNetwork(),
      cacheProvider: true,
      providerOptions: this.getProviderOptions()
    });
  }

  public componentDidMount() {
    if (this.web3Modal.cachedProvider) {
      this.onConnect();
    }
  }

  public onConnect = async () => {
    this.provider = await this.web3Modal.connect();
    const library = new Web3Provider(this.provider);
    const network = await library.getNetwork();
    
    const address = this.provider.selectedAddress ? this.provider.selectedAddress : this.provider.accounts[0];

    const libraryContract = getContract(LIBRARY_CONTRACT_ADDRESS, Library.abi, library, address);
    const ownerAddress = await libraryContract.owner();
    const libTokenAddress = await libraryContract.LIBToken();
    const libTokenContract = getContract(libTokenAddress, LIB.abi, library, address);



    await this.setState({
      library,
      chainId: network.chainId,
      address,
      connected: true,
      libraryContract,
      libTokenContract,
      ownerAddress
    });

	  await this.getAvailableBooks();
    await this.getLibBalance();
    await this.subscribeToProviderEvents(this.provider);

  };

  public subscribeToProviderEvents = async (provider:any) => {
    if (!provider.on) {
      return;
    }

    provider.on("accountsChanged", this.changedAccount);
    provider.on("networkChanged", this.networkChanged);
    provider.on("close", this.close);

    await this.web3Modal.off('accountsChanged');
  };

  public async unSubscribe(provider:any) {
    // Workaround for metamask widget > 9.0.3 (provider.off is undefined);
    window.location.reload();
    if (!provider.off) {
      return;
    }

    provider.off("accountsChanged", this.changedAccount);
    provider.off("networkChanged", this.networkChanged);
    provider.off("close", this.close);
  }

  public changedAccount = async (accounts: string[]) => {
    if(!accounts.length) {
      // Metamask Lock fire an empty accounts array 
      await this.resetApp();
    } else {
      await this.setState({ address: accounts[0] });
    }
  }

  public networkChanged = async (networkId: number) => {
    const library = new Web3Provider(this.provider);
    const network = await library.getNetwork();
    const chainId = network.chainId;
    await this.setState({ chainId, library });
  }
  
  public close = async () => {
    this.resetApp();
  }

  public getNetwork = () => getChainData(this.state.chainId).network;

  public getProviderOptions = () => {
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          infuraId: process.env.REACT_APP_INFURA_ID
        }
      }
    };
    return providerOptions;
  };

  public resetApp = async () => {
    await this.web3Modal.clearCachedProvider();
    localStorage.removeItem("WEB3_CONNECT_CACHED_PROVIDER");
    localStorage.removeItem("walletconnect");
    await this.unSubscribe(this.provider);

    this.setState({ ...INITIAL_STATE });

  };

  public getAvailableBooks = async () => {
    const { libraryContract } = this.state;
    const allBookIds = await libraryContract.getAllBookIds();
    await this.setState({allBookIds});
    const booksCount = allBookIds.length;
    
    const allBooks = [];
    for( let i = 0; i < booksCount; i++){
      const bookIndex = allBookIds[i];
      const book = await libraryContract.books(bookIndex);
      const borrowed = await this.isBorrowed(this.state.address, bookIndex);
	  const currentBook = {
      copies: book.copies.toString(),
      name: book.name,
      id: bookIndex,
      borrowed
	  }
	  allBooks.push(currentBook);
    }
	await this.setState({allBooks})
  }

  public refreshState = async () => {
    await this.setState({ transactionHash: null, bookName: null, bookId: null, bookCopies: null, fetching: false, error: null});
		await this.getAvailableBooks();
    await this.getLibBalance();
  }

  public addBook = async () => {
	const { libraryContract } = this.state;
	try{
		await this.setState({ fetching: true });
    const allBookIds = this.state.allBookIds;

    for( let i = 0; i < allBookIds.length; i++){
      const bookIndex = allBookIds[i];
      const book = await libraryContract.books(bookIndex);
      if(this.state.bookId === bookIndex && book.name === this.state.bookName)
      {
        return;    
      }
    }
		const transaction = await libraryContract.addBook(this.state.bookName, this.state.bookId, this.state.bookCopies);

		await this.setState({ transactionHash: transaction.hash });
		const transactionReceipt = await transaction.wait();
		if(transactionReceipt.status !== 1){
			await this.setState({ transaction: null, fetching: false, error: transaction.error });
			return;
		}

		await this.refreshState()
	}
	catch (error) {
		await this.setState({ transactionHash: null, bookName: null, bookId: null, bookCopies: null, fetching: false, error: error.message});
	}
  }

  public borrowBook = async (id: any) => {
	const{ libraryContract, libTokenContract } = this.state;
	const wrapValue = utils.parseEther('0.1');

  try{
		await this.setState({ fetching: true });

    const approveTx = await libTokenContract.approve(LIBRARY_CONTRACT_ADDRESS, wrapValue);
    await approveTx.wait()

		const transaction = await libraryContract.borrowBook(id);
		this.setState({ transactionHash: transaction.hash });
		const transactionReceipt = await transaction.wait();
		if(transactionReceipt.status !== 1){
		await this.setState({ transactionHash: null, bookName: null, bookId: null, bookCopies: null, fetching: false, error: null});
			return;
		}

		await this.refreshState();
	}
	catch (error) {
		await this.setState({ transactionHash: null, bookName: null, bookId: null, bookCopies: null, fetching: false, error: error.message});
	}
  }

  public returnBook = async (id: any) => {
	const { libraryContract } = this.state;
	try{
		await this.setState({ fetching: true });
		const transaction = await libraryContract.returnBook(id);
		await this.setState({ transactionHash: transaction.hash });
		const transactionReceipt = await transaction.wait();
		if(transactionReceipt.status !== 1){
			await this.setState({ transactionHash: null, fetching: false, error: transaction.error});
			return;
		}

		await this.refreshState();
	}
	catch (error) {
		await this.setState({ transactionHash: null, bookName: null, bookId: null, bookCopies: null, fetching: false, error: error.message});
	}
  }

  public isBorrowed = async (address: any, bookId: any) => {
	const { libraryContract } = this.state;
	return await libraryContract.borrowedBooks(address, bookId);
  }

  public handleChange = async (event: any) => {
	switch (event.target.name) {
		case 'book-name':
			await this.setState({bookName: event.target.value});
			break;
		case 'book-id':
			await this.setState({bookId: event.target.value});
			break;
		case 'book-copies':
			await this.setState({bookCopies: event.target.value});
			break;
    case 'lib-token':
      await this.setState({libToken: event.target.value});
      break;
	}
  }

  public async getLibBalance() {
    const { libTokenContract } = this.state;
    const userBalance = await libTokenContract.balanceOf(this.state.address);
    const libraryETHBalance = await libTokenContract._totalSupply;

    const libraryLIBBalance = (await libTokenContract.balanceOf(LIBRARY_CONTRACT_ADDRESS)).toString();

    await this.setState({ userBalance, libraryETHBalance, libraryLIBBalance });

  }

  public wrapLIB = async () => {
    const { libraryContract, libToken } = this.state;
    const wrapValue = utils.parseEther(libToken);
    const wrapTx = await libraryContract.wrap({value: wrapValue})
    await wrapTx.wait();

    await this.getLibBalance();
  }

  public withdrawETH = async () => {
    const { libraryContract, libTokenContract } = this.state;
    const approveTX = await libTokenContract.approve(LIBRARY_CONTRACT_ADDRESS, this.state.libraryLIBBalance)
    await approveTX.wait()
    await libraryContract.unwrap(libTokenContract.balanceOf(LIBRARY_CONTRACT_ADDRESS));
    await this.getLibBalance();  
  }

  public render = () => {
    const {
      address,
      connected,
      chainId,
      fetching
    } = this.state;
    return (
      <SLayout>
        <Column maxWidth={1000} spanHeight>
          <Header
            connected={connected}
            address={address}
            chainId={chainId}
            killSession={this.resetApp}
            // balance={this.state.balance}
            // libraryLIBBalance={this.state.libraryLIBBalance}
            // libraryETHBalance={this.state.libraryETHBalance}
            // isOwner={this.state.ownerAddress?.toLowerCase() === this.state.address.toLowerCase()}
          />

          <SContent>
            {fetching ? (
              <Column center>
                <SContainer>
                  <Loader />
                  
                  <Wrapper>
                  {this.state.transactionHash && <div>
                      {this.state.transactionHash}
                      <div>
                        <a href={`https://ropsten.etherscan.io/tx/${this.state.transactionHash}`} target="_blank" rel="noopener noreferrer" ><br/><Button>Link to Etherscan</Button></a>
                      </div>
                    </div>}
                  </Wrapper>
                </SContainer>
              </Column>
            ) : (
                <SLanding center>
                  {!this.state.connected && <ConnectButton onClick={this.onConnect} />}
                  <h5>CONTRACT LIB BAL: {String(this.state.libraryLIBBalance / 1000000000000000000)}</h5>
                  <h5>CONTRACT ETH BAL: {String(this.state.libraryETHBalance )}</h5>

                  {this.state.connected &&  <h6>BALANCE: {String(this.state.userBalance/1000000000000000000)} LIB</h6>}
                  {this.state.connected && this.state.allBooks?.length !== undefined && <form className='wrap'>
                    <div><br/>
                      <label>
                        Name:
                      </label>
                      <input type="text" id='book-name' name="book-name" onChange={() => {this.handleChange(event)}} /> 
                    </div>
					          <div><br/>
                      <label>
                        Id:
                      </label>
                      <input type="number" id='book-id' name="book-id" onChange={() => {this.handleChange(event)}} /> 
                    </div>
                    <div><br/>
                      <label>
                        Copies:
                      </label>
                      <input type="number" id='book-copies' name="book-copies" onChange={() => {this.handleChange(event)}}/>
                    </div><br/>  
                    <Button onClick={() => this.addBook()} >Add Book</Button>
                  <br/><br/></form>}

                  {this.state.connected && 
				          <Wrapper>
                    {this.state.allBooks != null && this.state.allBooks?.map((book:any, index) => (
                      <form key={index}>
                        {/* <p>Book Name:</p> */}
                        <p className="name">
                          {book.name}
                        </p>
						            {/* <p>Book Id:</p> */}
                        { this.state.allBookIds != null && <p className="id">
                          Id: {String(this.state.allBookIds[index])}
                        </p>}
                        {/* <p>Available Copies:</p> */}
                        <p className="copies">
                          Available copies: {book.copies}
                        </p>
                        { !book.borrowed && <Button disabled={book.copies === '0'} onClick={() => this.borrowBook( this.state.allBookIds![index])} >Borrow</Button>}
                        { book.borrowed != null && <Button color="red" onClick={() => this.returnBook(this.state.allBookIds![index])}>Return</Button>}
                      </form>
                    ))}

                  </Wrapper>}
                  { this.state.connected && <form className='wrap'>
                  <div>
                      <label>
                        Wrap ETH TO LIB:
                      </label>
                      <input type="text" id='lib-token' name="lib-token" onChange={() => {this.handleChange(event)}} /> 
                    </div><br/>
                    <Button onClick={() => this.wrapLIB()} >Wrap</Button>
                  </form>}
                  
                  {this.state.error && <h6>
                    {this.state.error}
                  </h6>}

                  {this.state.ownerAddress?.toLowerCase() === this.state.address.toLowerCase() && 
                  <div>
                    <Button disabled={this.state.libraryLIBBalance === '0'} onClick={() => this.withdrawETH()} >Withdraw ALL Funds</Button>
                  </div>}
                </SLanding>
              )}
          </SContent>
        </Column>
      </SLayout>
    );
  };
}

export default App;

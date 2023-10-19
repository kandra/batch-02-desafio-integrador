// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import {IUniSwapV2Router02, IBBitesToken} from "./Interfaces.sol";

contract PublicSale is Pausable, AccessControl {
    IUniSwapV2Router02 router;
    IBBitesToken bbitesToken;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant EXECUTER_ROLE = keccak256("EXECUTER_ROLE");

    // 00 horas del 30 de septiembre del 2023 GMT
    uint256 constant startDate = 1696032000;

    // Maximo price NFT
    uint256 constant MAX_PRICE_NFT = 90_000 * 10 ** 18;

    uint8 constant DECIMALS_BBTKN = 6;
    mapping(uint256 => address) public tokenBuyer;
    uint256 misticAvailable = 300;

    event PurchaseNftWithId(address account, uint256 id);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
    }

    function purchaseWithTokens(uint256 _id) public whenNotPaused {
        require(tokenBuyer[_id]==address(0), "Token ID has already been claimed");


        emit PurchaseNftWithId(msg.sender, _id);
    }

    function purchaseWithUSDC(uint256 _id, uint256 _amountIn) external whenNotPaused {
        // transfiere _amountIn de USDC a este contrato
        // llama a swapTokensForExactTokens: valor de retorno de este metodo es cuanto gastaste del token input
        // transfiere el excedente de USDC a msg.sender


        emit PurchaseNftWithId(msg.sender, _id);
    }

    function purchaseWithEtherAndId(uint256 _id) public payable whenNotPaused {
        require(tokenBuyer[_id]==address(0), "Token ID has already been claimed");
        require( msg.value >= 0.01 ether, "Send at least 0.01 Ether");
        require(_id >= 700 && _id <=999, "Token ID should be within range 700 - 999");

        tokenBuyer[_id] = msg.sender;
        if (msg.value > 0.01 ether){
            uint256 change = msg.value - 0.01 ether;
            payable(msg.sender).transfer(change);
        }
        misticAvailable--;
        emit PurchaseNftWithId(msg.sender, _id);
    }

    function depositEthForARandomNft() public payable whenNotPaused {
        require( misticAvailable > 0, "No Mistic tokens available");
        require(msg.value >= 0.01 ether, "For a random token, send at least 0.01 Ether");
        uint256 _randomToken = _getRandomNumber700to999();
        uint8 counter = 1;

        // Find a free token
        while( tokenBuyer[_randomToken] != address(0) ){
            if (_randomToken == 999){
                _randomToken = 700;
            }else{
                _randomToken += 1;
            }
            counter++;
            require( counter < 300, "No available tokens");
        }

        tokenBuyer[_randomToken] = msg.sender;
        if (msg.value > 0.01 ether){
            uint256 change = msg.value - 0.01 ether;
            payable(msg.sender).transfer(change);
        }
        misticAvailable--;
    console.log("%s", _randomToken);
        emit PurchaseNftWithId(msg.sender, _randomToken);
    }

    function withdrawEther() public onlyRole(DEFAULT_ADMIN_ROLE){
        console.log("balance: %s", address(this).balance);
        payable(msg.sender).transfer(address(this).balance);
    }



    receive() external payable {
        depositEthForARandomNft();
    }

    ////////////////////////////////////////////////////////////////////////
    /////////                    Helper Methods                    /////////
    ////////////////////////////////////////////////////////////////////////

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function getPriceForId(uint256 id) public view returns(uint256){
        require(id < 700, "Token ID must be between 0 and 699");
        require(tokenBuyer[id] == address(0), "Token ID is already taken");
        
        if (id <= 199){
            return 1000*10**DECIMALS_BBTKN;
        }else if (id >= 200 && id <=499){
            return id*20*10**DECIMALS_BBTKN;
        }else if (id >= 500 && id <= 699){
            uint256 daysPassed = (block.timestamp - startDate)/86400;
            uint256 price = 10000*(2000*daysPassed);
            if (price>90000){
                return 90000*10**DECIMALS_BBTKN;
            }else{
                return price*10**DECIMALS_BBTKN;
            }
        }
    }

    function _getRandomNumber700to999() internal view returns (uint256){
        uint256 randomNumber = uint256(
            keccak256(
                abi.encodePacked(
                    msg.sender,
                    blockhash(block.number - 1),
                    block.timestamp
                )
            )
        ) % 300 + 700;
        return randomNumber;
    }
}

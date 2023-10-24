// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import {IUniSwapV2Router02, IBBitesToken, IUSDCoin} from "./Interfaces.sol";

contract PublicSale is Pausable, AccessControl {
    IUniSwapV2Router02 router;
    IBBitesToken bbitesToken;
    IUSDCoin usdcToken;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant EXECUTER_ROLE = keccak256("EXECUTER_ROLE");

    // 00 horas del 30 de septiembre del 2023 GMT
    uint256 constant startDate = 1696032000;

    // Maximo price NFT
    uint256 constant MAX_PRICE_NFT = 90_000 * 10 ** 18;

    uint8 constant DECIMALS_BBTKN = 18;
    mapping(uint256 => address) public tokenBuyer;
    uint256 misticAvailable = 300;

    address addressTokenUSDC;
    address addressTokenBBTKN;

    event PurchaseNftWithId(address account, uint256 id);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        // bbitesToken = IBBitesToken(0xe9bE45d717b89612f37E6A512ceeC8388A0416Fc);
        // usdcToken = IUSDCoin(0xe6666d3bcE86933b4a3b96f364a263d79312dEEc);
        router = IUniSwapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
    }

    function purchaseWithTokens(uint256 _id) public whenNotPaused {
        // console.log("id: %s", _id);
        // require(_id >= 699, "Token ID is out of range 0 - 699");
        // require(tokenBuyer[_id]==address(0), "Token ID has already been claimed");
        uint256 price = getPriceForId(_id);
        uint256 allowance = bbitesToken.allowance(msg.sender, address(this));
        console.log("allowance: %s, price %s", allowance, price);
        require(allowance >= price, "Give approval to this contract to transfer the required tokens");
        bbitesToken.transferFrom(msg.sender, address(this), price);
        tokenBuyer[_id] = msg.sender;
        emit PurchaseNftWithId(msg.sender, _id);
    }

    function purchaseWithUSDC(uint256 _id, uint256 _amountIn) external whenNotPaused {
        uint256 amountOut = getPriceForId(_id);
        require(
            usdcToken.allowance(msg.sender, address(this))>= _amountIn, 
            "Give approval to this contract to transfer the required tokens"
        );
        // transfiere _amountIn de USDC a este contrato
        require(
            usdcToken.transferFrom(msg.sender, address(this), _amountIn) == true,
            "Error while transfering USDC to this contract"
        );

        // llama a swapTokensForExactTokens: valor de retorno de este metodo es cuanto gastaste del token input
        address[] memory path;
        // Token a entregar - USDC
        path[0] = addressTokenUSDC;
        // Token a recibir - BBTKN
        path[1] = addressTokenBBTKN;

        uint[] memory amounts = router.swapTokensForExactTokens(
            amountOut,
            _amountIn,
            path,
            msg.sender,
            block.timestamp + 2000
        );
        console.log("amount returned swap tokens: %s / %s", amounts[0], amounts[1]);

        // transfiere el excedente de USDC a msg.sender
        uint256 change = _amountIn - amounts[0];
        require(
            usdcToken.transferFrom(address(this), msg.sender, change) == true,
            "Error while transfering USDC to the sender"
        );

        tokenBuyer[_id] = msg.sender;
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
        // console.log("balance: %s", address(this).balance);
        payable(msg.sender).transfer(address(this).balance);
    }

    function withdrawTokens() public onlyRole(DEFAULT_ADMIN_ROLE){
        // console.log("address token: %s", address(bbitesToken));
        uint256 balance = bbitesToken.balanceOf(address(this));
        // console.log("balance BBTKN1 %s", balance);
        bbitesToken.transfer(msg.sender, balance);
        // console.log("balance BBTKN2 %s", bbitesToken.balanceOf(address(this)));
        // console.log("balance BBTKN2 %s", bbitesToken.balanceOf(msg.sender));
    }

    // function getAmountIn(uint _amountOut, address _tokenUSDC, address _tokenBBTKN) public view returns (uint amountIn){
    //     address factoryA = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
    //     uint256 reserveA; 
    //     uint256 reserveB;
    //     (reserveA, reserveB) = router.getReserves(factoryA, _tokenUSDC, _tokenBBTKN);
    //     console.log("reserva usdc %s", reserveA);
    //     console.log("reserva bbtkn %s", reserveB);
    //     return router.getAmountIn(_amountOut, reserveA, reserveB);
    // }


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

    function setTokenContract(address _address) public onlyRole(DEFAULT_ADMIN_ROLE){
        bbitesToken = IBBitesToken(_address);
        addressTokenBBTKN = _address;
    }
    function setUSDCContract(address _address) public onlyRole(DEFAULT_ADMIN_ROLE){
        usdcToken = IUSDCoin(_address);
        addressTokenUSDC = _address;
    }
}

var { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
var { expect } = require("chai");
var { ethers } = require("hardhat");
var { time } = require("@nomicfoundation/hardhat-network-helpers");

const { getRole, deploySC, deploySCNoUp, ex, pEth } = require("../utils");

const DEFAULT_ADMIN_ROLE = getRole("DEFAULT_ADMIN_ROLE");
const MINTER_ROLE = getRole("MINTER_ROLE");
const BURNER_ROLE = getRole("BURNER_ROLE");

// 00 horas del 30 de septiembre del 2023 GMT
var startDate = 1696032000;

var owner, alice, signerWhitelist;

const DECIMALS_BBTKN = 18;

const proofs = [
    '0x9682923cee08a0d2c343f252beae1ef85540e977e80fa686488f9f10ea4685ec',
    '0x48781e8f88ab4d1d07af285d1367732f0dcc4e6f5704640f66ea3c8d3864b713',
    '0xa05e993355027b3037785d2f63c3363ab61b69e430d4054e364c9566dfb8d0ee',
    '0xa8e78c35b8fdaa5a0f307cd1d8b12dfa9d0fd99b528ade7bfcbf2b467e35cb6c',
    '0x7e6e241807eba959c7e886d66fbb24ed7eb9704acfa05c05c31ab7dd5c7d8325',
    '0x839e6099895ad99f1b5195b401d7b131744def11071dfe8e463f6a0ac1d918a0',
    '0x7da7c7f5098b4704e5564d19f6d65bc3f551112e46081cd0b70c8cfab4d0a9b0',
    '0x9a184d9a1744e8e9093ac5e65d7e96c1b609549a75d38c610f538aead2b04c58',
    '0x7bb0854a5a2a180c8416993d26910d3100cd9f9bc389fb8ac6449d3e37c467d7',
    '0x7f818777dfe171b443c8a7d57bd2d50e26850f9bd2640b905e5e0b82d205818c'
  ];

var addressUSDC = "0xe6666d3bcE86933b4a3b96f364a263d79312dEEc";
var addressBBTKN = "0xe9bE45d717b89612f37E6A512ceeC8388A0416Fc";

before(async () => {
    [owner, alice] = await ethers.getSigners();
    provider = ethers.provider;

    // whitelistSigner = await hre.ethers.getSigner("0x007c5e822b66C5463a465ffC17BCf7E02aA9E1A4");
    // var whitelistAddress = "0x007c5e822b66C5463a465ffC17BCf7E02aA9E1A4";
    // signerWhitelist = await ethers.getSigner(whitelistAddress);
    // await network.provider.send("hardhat_setBalance", [
    //     addressA,
    //     "0x1000", //valor en hexadecimal
    //   ]);
});

describe("Set up", function () {
    it("Publicar los contratos", async () => {
        // Publicar BBTKN 
        BBitesToken = await hre.ethers.getContractFactory("BBitesToken");
        // contract_BBitesToken = await BBitesToken.deploy();
        contract_BBitesToken = await hre.upgrades.deployProxy(BBitesToken, {
            kind: "uups",
        });
        var implementationAddress = await hre.upgrades.erc1967.getImplementationAddress(
            contract_BBitesToken.target
        );
        // console.log(`El address del Proxy es ${contract_BBitesToken.target}`);
        // console.log(`El address de la implementacion es ${implementationAddress}`);

        // // Publicar CuyNFT
        CuyCollectionNFT = await hre.ethers.getContractFactory("CuyCollectionNFT");
        // contract_CuyCollectionNFT = await CuyCollectionNFT.deploy("Cuy Collection NFT", "CUYNFT");
        contract_CuyCollectionNFT = await hre.upgrades.deployProxy(CuyCollectionNFT, {
            kind: "uups",
        });
        

        // Publicar USDC clone
        USDC = await hre.ethers.getContractFactory("USDCoin");
        contract_USDC = await USDC.deploy();

        // // Publicar Public Sale
        PublicSale = await hre.ethers.getContractFactory("PublicSale");
        contract_PublicSale = await PublicSale.deploy();
        await contract_PublicSale.setTokenContract(contract_BBitesToken.target);
        await contract_PublicSale.setUSDCContract(contract_USDC.target);
    });
});

describe("BBitesToken", function () {
    it("mint protegido por MINTER_ROLE", async () => {
        const mint = contract_BBitesToken.connect(alice).mint;
        await expect(
          mint(alice.address, ethers.parseEther("1000"))
        ).to.revertedWith(
          `AccessControl: account ${alice.address.toLowerCase()} is missing role ${MINTER_ROLE}`
        );
    });
    it("owner has BBTKN tokens at start", async () => {
        var balanceOwner = await contract_BBitesToken.balanceOf(owner);
        expect(balanceOwner).to.be.above(0, "Owner should have minted tokens at start");
    });
});

describe("Cuy Collection NFT - MINT", function () {
    it("mint protegido por MINTER_ROLE", async () => {
        // await contract_CuyCollectionNFT.connect(alice).safeMint(alice.address, 4);
        await expect(contract_CuyCollectionNFT.connect(alice).safeMint(alice.address, 4)).to.revertedWith(
            `AccessControl: account ${alice.address.toLowerCase()} is missing role ${MINTER_ROLE}`
        );
    });
    it("validates token ID < 999", async() => {
        await expect(contract_CuyCollectionNFT.safeMint(alice.address, 1999)).to.revertedWith("Only allows token IDs from 0 to 999");
    });
    it("validates token ID is not taken", async() => {
        await contract_CuyCollectionNFT.safeMint(alice.address, 4);
        await expect(contract_CuyCollectionNFT.safeMint(alice.address, 4)).to.revertedWith("Token ID has already been claimed");
    });
    it("allows the minter to mint", async () => {
        await contract_CuyCollectionNFT.connect(owner).safeMint(alice.address, 13);
        var tokenOwner = await contract_CuyCollectionNFT.ownerOf(13);
        expect(tokenOwner).to.equal(alice.address, "Minter should have minted the token for the wallet");
    });
    it("validates wallet within Merkle Tree", async() => {
        var leaf = Buffer.from(
            ethers
              .solidityPackedKeccak256(["uint256", "address"], [1002, "0x007c5e822b66C5463a465ffC17BCf7E02aA9E1A4"])
              .slice(2),
            "hex"
          );
        // var leaf = '48d7765f2d535d1bfc5f5a3e6805c47ac523986ee1d64285425c73d388a2c022';
        // console.log(leaf);
        // var raiz = await contract_CuyCollectionNFT.root();
        // console.log("root" + raiz);
        var result = await contract_CuyCollectionNFT.verify(leaf, proofs);
        await expect(result).to.equal(true, "Doesn't recognize the wallet ID to belong to the Merkle tree");
    });
    it("validates wallet doesn't belong within Merkle Tree", async() => {
        var leaf = Buffer.from(
            ethers
              .solidityPackedKeccak256(["uint256", "address"], [1002, "0x2AeA83263b22Dc988B4438573040F6536D642a44"])
              .slice(2),
            "hex"
          );
        var result = await contract_CuyCollectionNFT.verify(leaf, proofs);
        await expect(result).to.equal(false, "Should recognize the wallet ID doesn't belong to the Merkle tree");
    });
    it("validates whitelist wallet can mint given tokenId", async() => {
        await contract_CuyCollectionNFT.safeMintWhiteList('0x007c5e822b66C5463a465ffC17BCf7E02aA9E1A4',1002, proofs);
        var tokenOwner = await contract_CuyCollectionNFT.ownerOf(1002);
        expect(tokenOwner).to.equal('0x007c5e822b66C5463a465ffC17BCf7E02aA9E1A4', "Should have minted the token for the whitelisted wallet");
    });
    it("validates whitelist wallet isn't asking a different tokenId", async() => {
          await expect(contract_CuyCollectionNFT.safeMintWhiteList('0x007c5e822b66C5463a465ffC17BCf7E02aA9E1A4',1003, proofs)).to.revertedWith("Wallet & Token ID combination is not included in the WhiteList");
    });
    
});
describe("Cuy Collection NFT - BURN", function () {
    it("validates token ID is within the range", async() =>{
        await contract_CuyCollectionNFT.connect(owner).safeMint(alice.address, 44);
        await expect(contract_CuyCollectionNFT.buyBack(44)).to.revertedWith("Token ID is not within the 1000 - 1999 range");
    });
    it("validates token ID cannot be burned by non-owner", async() =>{
        // await contract_CuyCollectionNFT.safeMintWhiteList('0x007c5e822b66C5463a465ffC17BCf7E02aA9E1A4',1002, proofs);
        await expect(contract_CuyCollectionNFT.connect(owner).buyBack(1002)).to.revertedWith("You are not the token's owner");
    });
    it("validates token ID can be burned by its owner", async() => {

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x007c5e822b66C5463a465ffC17BCf7E02aA9E1A4"],
          });
        const signer = await ethers.getSigner("0x007c5e822b66C5463a465ffC17BCf7E02aA9E1A4")
        // console.log(await contract_CuyCollectionNFT.ownerOf(1002));
        // console.log(whitelistSigner.address);
        await network.provider.send("hardhat_setBalance", [
                signer.address,
                "0x86827644211B00", //valor en hexadecimal
              ]);
        expect(await contract_CuyCollectionNFT.connect(signer).buyBack(1002)).to.emit(contract_BBitesToken, "Burn");
        await hre.network.provider.request({ 
            method: "hardhat_stopImpersonatingAccount", 
            params: ["0x007c5e822b66C5463a465ffC17BCf7E02aA9E1A4"] 
        });
    });
    // it("---testing getting URI for NFT", async() =>{
    //     // await contract_CuyCollectionNFT.buyBack()
    //     await contract_CuyCollectionNFT.safeMint(alice.address, 0);
    //     var r = await contract_CuyCollectionNFT.tokenURI(0);
    //     // console.log("URI: "+r);
    // });
});
describe("Public Sale tests", function () {
    it("Helper: Price", async() => { 

        // Token is outside allowed range
        await expect(contract_PublicSale.getPriceForId(8880)).to.revertedWith("Token ID must be between 0 and 699");

        // Common token price
        var price = await contract_PublicSale.getPriceForId(100);
        expect(price).to.be.equal(1000*10**DECIMALS_BBTKN, `Price for common token should be 100000000 BBTKN and it's at ${price}`);

        // Rare token price
        var price = await contract_PublicSale.getPriceForId(444);
        expect(price).to.be.equal(444*20*10**DECIMALS_BBTKN, `Price for rare token is not as expected`);

        var price_contract = await contract_PublicSale.getPriceForId(666);
        days = Math.floor((Date.now() - startDate)/3600*24);
        price = 10000+(2000*days);
        if (price > 90000) price = 90000;
        expect(price_contract).to.be.equal(price*10**DECIMALS_BBTKN, `Price for Legendary token is not as expected`);

        // TODO: Token is already taken
    });
    it("Ether to buy - wrong token ID", async() => {
        await expect(contract_PublicSale.purchaseWithEtherAndId(1, {value: ethers.parseEther("0.01")})).to.revertedWith("Token ID should be within range 700 - 999");

    });
    
    it("Ether to buy - not enough ether", async() => {
        await expect( contract_PublicSale.purchaseWithEtherAndId(777)).to.revertedWith("Send at least 0.01 Ether");
        await expect( contract_PublicSale.purchaseWithEtherAndId( 777, { value: 10000 } )).to.revertedWith("Send at least 0.01 Ether");
    });
    it("Ether to buy - validate mint", async() => {
        await expect(contract_PublicSale.connect(alice).purchaseWithEtherAndId(777, {value: ethers.parseEther("0.01")})).to.emit(contract_PublicSale, "PurchaseNftWithId");
        await expect(await contract_PublicSale.tokenBuyer(777)).to.equal(alice.address);
        
    });
    it("Ether to buy - give change", async() => {
        const initBalance = await provider.getBalance(alice.address);
        //expect(contract_PublicSale.connect(alice).purchaseWithEtherAndId(888, {value: ethers.parseEther("1")})).to.emit(contract_PublicSale, "PurchaseNftWithId");
        const tx = await contract_PublicSale.connect(alice).purchaseWithEtherAndId(888, {value: ethers.parseEther("1")});
        const receipt = await tx.wait();
        const gasSpent = BigInt(receipt.gasUsed) * BigInt(receipt.gasPrice);
        const newBalance = await provider.getBalance(alice.address);

        // console.log(newBalance - (initBalance - gasSpent - pEth("0.01")));
        expect(newBalance).to.equal(initBalance-pEth("0.01")-gasSpent);

    });
    it("Ether to buy - Token ID already taken", async() => {
        await expect(contract_PublicSale.connect(alice).purchaseWithEtherAndId(777, {value: ethers.parseEther("0.01")})).to.revertedWith("Token ID has already been claimed");
    });
    it("Ether to buy - random token ID", async() => {
        await expect(contract_PublicSale.connect(alice).depositEthForARandomNft({value: pEth("0.01")})).to.emit(contract_PublicSale, "PurchaseNftWithId");
        // for (var i = 0; i<300; i++){
        //     await expect(contract_PublicSale.connect(alice).depositEthForARandomNft({value: pEth("0.01")})).to.emit(contract_PublicSale, "PurchaseNftWithId");
        // }
    });

    // buy via BBTKN
    it("BBTKN to buy - Token ID is out of range", async() => {
        await expect(contract_PublicSale.connect(alice).purchaseWithTokens(4929)).to.revertedWith("Token ID must be between 0 and 699");
    });
    it("BBTKN to buy - No approval", async() => {
        await expect(contract_PublicSale.connect(alice).purchaseWithTokens(111)).to.revertedWith("Give approval to this contract to transfer the required tokens");
    });
    it("BBTKN to buy - Not enough approval", async() => {
        await contract_BBitesToken.connect(alice).approve(contract_PublicSale.target, 500);
        await expect(contract_PublicSale.connect(alice).purchaseWithTokens(111)).to.revertedWith("Give approval to this contract to transfer the required tokens");
    });
    it("BBTKN to buy - Not enough BBTKN balance", async() => {
        await contract_BBitesToken.connect(alice).approve(contract_PublicSale.target, pEth("500"));
        await expect(contract_PublicSale.connect(alice).purchaseWithTokens(111)).to.revertedWith("ERC20: transfer amount exceeds balance");
    });
    it("BBTKN to buy - Buying common token", async() => {
        await contract_BBitesToken.connect(owner).mint(alice.address, pEth("90000"));
        await contract_BBitesToken.connect(alice).approve(contract_PublicSale.target, pEth("500"));
        await expect(contract_PublicSale.connect(alice).purchaseWithTokens(111)).to.emit(contract_PublicSale, "PurchaseNftWithId");
    });
    it("BBTKN to buy - Buying rare token", async() => {
        await contract_BBitesToken.connect(owner).mint(alice.address, pEth("90000"));
        await contract_BBitesToken.connect(alice).approve(contract_PublicSale.target, pEth("500"));
        await expect(contract_PublicSale.connect(alice).purchaseWithTokens(333)).to.emit(contract_PublicSale, "PurchaseNftWithId");
    });
    it("BBTKN to buy - Buying legendary token", async() => {
        await contract_BBitesToken.connect(owner).mint(alice.address, pEth("90000"));
        await contract_BBitesToken.connect(alice).approve(contract_PublicSale.target, pEth("500"));
        await expect(contract_PublicSale.connect(alice).purchaseWithTokens(666)).to.emit(contract_PublicSale, "PurchaseNftWithId");
    });
    it("BBTKN to buy - Token ID is already taken", async() => {
        await expect(contract_PublicSale.connect(alice).purchaseWithTokens(666)).to.revertedWith("Token ID is already taken");
    });
    it("Withdraw all ETH can only be done by admin/owner", async() => {
        await expect(contract_PublicSale.connect(alice).withdrawEther()).to.be.reverted;

        var balance = await ethers.provider.getBalance(contract_PublicSale.target);
        await expect(
            contract_PublicSale.connect(owner).withdrawEther()
        ).to.changeEtherBalance(owner, balance);
    });
    it("Withdraw all tokens BBTKN can only be done by admin/owner", async() => {
        // console.log("address contract token: " + contract_BBitesToken.target);
        await expect(contract_PublicSale.connect(alice).withdrawTokens()).to.be.reverted;
        
        var balance = await contract_BBitesToken.balanceOf(contract_PublicSale.target);
        console.log("balance tokens: " + balance);
        await expect(
            contract_PublicSale.connect(owner).withdrawTokens()
        ).to.changeTokenBalances(contract_BBitesToken, [contract_PublicSale, owner], [-balance, balance]);
    });

    // buy via USDC
    // it("USDC to buy - returns estimation on how much USDC is needed", async() => {
    //     var amount = await contract_PublicSale.getAmountIn(10000,addressUSDC, addressBBTKN);
    //     console.log("amount in: " + amount);
    // });
    it("USDC to buy - Token ID is out of range", async() => {
        await expect(contract_PublicSale.connect(alice).purchaseWithUSDC(4929, 5000)).to.revertedWith("Token ID must be between 0 and 699");
    });
    it("USDC to buy - No approval", async() => {
        await expect(contract_PublicSale.connect(alice).purchaseWithUSDC(222, 5000)).to.revertedWith("Give approval to this contract to transfer the required tokens");
    });
    it("USDC to buy - Not enough approval", async() => {
        await contract_USDC.connect(alice).approve(contract_PublicSale.target, 500);
        await expect(contract_PublicSale.connect(alice).purchaseWithUSDC(222,5000)).to.revertedWith("Give approval to this contract to transfer the required tokens");
    });
    it("USDC to buy - Not enough USDC sent", async() => {
        // await contract_BBitesToken.connect(alice).approve(contract_PublicSale.target, pEth("500"));
        await expect(contract_PublicSale.connect(alice).purchaseWithUSDC(222, 10)).to.be.reverted;
    });
    // Getting change
    // it("USDC to buy - Buying common token", async() => {
    //     var price = await contract_PublicSale.getPriceForId(222);
    //     console.log(price);
    //     await contract_USDC.connect(owner).mint(alice.address, pEth("100"));
    //     await contract_USDC.connect(alice).approve(contract_PublicSale.target, pEth("100"));
    //     var balance = await contract_USDC.balanceOf(alice.address);
    //     console.log("pre-balance de alice: " + balance );
    //     await expect(contract_PublicSale.connect(alice).purchaseWithUSDC(222, pEth("100"))).to.emit(contract_PublicSale, "PurchaseNftWithId");
    //     balance = await contract_USDC.balanceOf(alice.address);
    //     console.log("post-balance de alice: " + balance );
    // });
    // it("USDC to buy - Buying rare token", async() => {
    //     await contract_BBitesToken.connect(owner).mint(alice.address, pEth("90000"));
    //     await contract_BBitesToken.connect(alice).approve(contract_PublicSale.target, pEth("500"));
    //     await expect(contract_PublicSale.connect(alice).purchaseWithTokens(333)).to.emit(contract_PublicSale, "PurchaseNftWithId");
    // });
    // it("BBTKN to buy - Buying legendary token", async() => {
    //     await contract_BBitesToken.connect(owner).mint(alice.address, pEth("90000"));
    //     await contract_BBitesToken.connect(alice).approve(contract_PublicSale.target, pEth("500"));
    //     await expect(contract_PublicSale.connect(alice).purchaseWithTokens(666)).to.emit(contract_PublicSale, "PurchaseNftWithId");
    // });
    it("USDC to buy - Token ID is already taken", async() => {
        await expect(contract_PublicSale.connect(alice).purchaseWithUSDC(111, 5000)).to.revertedWith("Token ID is already taken");
    });
});
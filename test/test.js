var { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
var { expect } = require("chai");
var { ethers } = require("hardhat");
var { time } = require("@nomicfoundation/hardhat-network-helpers");

const { getRole, deploySC, deploySCNoUp, ex, pEth } = require("../utils");

const MINTER_ROLE = getRole("MINTER_ROLE");
const BURNER_ROLE = getRole("BURNER_ROLE");

// 00 horas del 30 de septiembre del 2023 GMT
var startDate = 1696032000;

var owner, alice;

before(async () => {
    [owner, alice, bob] = await ethers.getSigners();
});

describe("Set up", function () {
    it("Publicar los contratos", async () => {
        // Publicar BBTKN 
        BBitesToken = await hre.ethers.getContractFactory("BBitesToken");
        contract_BBitesToken = await BBitesToken.deploy();

        // Set up Roles
        CuyCollectionNFT = await hre.ethers.getContractFactory("CuyCollectionNft");
        contract_CuyCollectionNFT = await CuyCollectionNFT.deploy("Cuy Collection NFT", "CUYNFT");
        
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
        var proofs = [
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
        var proofs = [
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
        var proofs = [
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
        await contract_CuyCollectionNFT.safeMintWhiteList('0x007c5e822b66C5463a465ffC17BCf7E02aA9E1A4',1002, proofs);
        var tokenOwner = await contract_CuyCollectionNFT.ownerOf(1002);
        expect(tokenOwner).to.equal('0x007c5e822b66C5463a465ffC17BCf7E02aA9E1A4', "Should have minted the token for the whitelisted wallet");
    });
    it("validates whitelist wallet isn't asking a different tokenId", async() => {
        var proofs = [
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
          await expect(contract_CuyCollectionNFT.safeMintWhiteList('0x007c5e822b66C5463a465ffC17BCf7E02aA9E1A4',1003, proofs)).to.revertedWith("Wallet & Token ID combination is not included in the WhiteList");
    });
    
});
describe("Cuy Collection NFT - BURN", function () {
    it("validates token ID is within the range", async() =>{
        await contract_CuyCollectionNFT.connect(owner).safeMint(alice.address, 44);
        await expect(contract_CuyCollectionNFT.buyBack(44)).to.revertedWith("Token ID is not within the 1000 - 1999 range");
    });
    it("validates token ID cannot be burned by non-owner", async() =>{
        // var proofs = [
        //     '0x9682923cee08a0d2c343f252beae1ef85540e977e80fa686488f9f10ea4685ec',
        //     '0x48781e8f88ab4d1d07af285d1367732f0dcc4e6f5704640f66ea3c8d3864b713',
        //     '0xa05e993355027b3037785d2f63c3363ab61b69e430d4054e364c9566dfb8d0ee',
        //     '0xa8e78c35b8fdaa5a0f307cd1d8b12dfa9d0fd99b528ade7bfcbf2b467e35cb6c',
        //     '0x7e6e241807eba959c7e886d66fbb24ed7eb9704acfa05c05c31ab7dd5c7d8325',
        //     '0x839e6099895ad99f1b5195b401d7b131744def11071dfe8e463f6a0ac1d918a0',
        //     '0x7da7c7f5098b4704e5564d19f6d65bc3f551112e46081cd0b70c8cfab4d0a9b0',
        //     '0x9a184d9a1744e8e9093ac5e65d7e96c1b609549a75d38c610f538aead2b04c58',
        //     '0x7bb0854a5a2a180c8416993d26910d3100cd9f9bc389fb8ac6449d3e37c467d7',
        //     '0x7f818777dfe171b443c8a7d57bd2d50e26850f9bd2640b905e5e0b82d205818c'
        //   ];
        // await contract_CuyCollectionNFT.safeMintWhiteList('0x007c5e822b66C5463a465ffC17BCf7E02aA9E1A4',1002, proofs);
        await expect(contract_CuyCollectionNFT.connect(owner).buyBack(1002)).to.revertedWith("You are not the token's owner");
    });
    // it("validates token ID can be burned by its owner", async() => {
    //     await expect(contract_CuyCollectionNFT.connect('0x007c5e822b66C5463a465ffC17BCf7E02aA9E1A4').buyBack(1002)).to.emit(contract_BBitesToken, "Burn");
    // });
    it("---testing getting URI for NFT", async() =>{
        // await contract_CuyCollectionNFT.buyBack()
        await contract_CuyCollectionNFT.connect(owner).safeMint(alice.address, 0);
        var r = await contract_CuyCollectionNFT.tokenURI(0);
        console.log("URI: "+r);
    });
});

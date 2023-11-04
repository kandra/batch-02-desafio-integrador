var { expect } = require("chai");
var { ethers } = require("hardhat");

const { ex, pEth } = require("../utils");

var signerWhitelist1002;

async function mint1002(){
    signerWhitelist1002 = await hre.ethers.getSigner("0x007c5e822b66C5463a465ffC17BCf7E02aA9E1A4");

    var CuyNFTProxyAddress = "0xadC7cd04E6693C816ef8d314e526A5684f13D752";
    var tokenAbi = ["function safeMintWhiteList(address to, uint256 tokenId, bytes32[] calldata proofs)"];
    var tokenContract = new ethers.Contract(CuyNFTProxyAddress, tokenAbi, signerWhitelist1002);

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
    console.log("Llamando contrato....");
    var tx = await tokenContract.safeMintWhiteList('0x007c5e822b66C5463a465ffC17BCf7E02aA9E1A4',1002, proofs);
    var res = await tx.wait();
    console.log(res);
}
mint1002()
.catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });;
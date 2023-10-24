import { Contract, ethers } from "ethers";

var usdcTknAbi = require("../artifacts/contracts/USDCoin.sol/USDCoin.json").abi;
var bbitesTokenAbi = require("../artifacts/contracts/BBitesToken.sol/BBitesToken.json").abi;
// import publicSaleAbi
var publicSaleAbi = require("../artifacts/contracts/PublicSale.sol/PublicSale.json").abi;
// import nftTknAbi
var nftTknAbi = require("../artifacts/contracts/CuyCollectionNft.sol/CuyCollectionNFT.json").abi;

// SUGERENCIA: vuelve a armar el MerkleTree en frontend
// Utiliza la libreria buffer
import buffer from "buffer/";
import walletAndIds from "../wallets/walletList";
import { MerkleTree } from "merkletreejs";
var Buffer = buffer.Buffer;
var merkleTree;

function hashToken(tokenId, account) {
  return Buffer.from(
    ethers
      .solidityPackedKeccak256(["uint256", "address"], [tokenId, account])
      .slice(2),
    "hex"
  );
}
function buildMerkleTree() {
  var elementosHasheados;
  merkleTree = new MerkleTree(elementosHasheados, ethers.keccak256, {
    sortPairs: true,
  });
}

var provider, signer, account;
var usdcTkContract, bbitesTknContract, pubSContract, nftContract;
var usdcAddress, bbitesTknAdd, pubSContractAdd;

function initSCsGoerli() {
  provider = new ethers.BrowserProvider(window.ethereum);

  usdcAddress = "0xe6666d3bcE86933b4a3b96f364a263d79312dEEc";
  bbitesTknAdd = "0xe9bE45d717b89612f37E6A512ceeC8388A0416Fc";
  pubSContractAdd = "0xb044dA5A4E702023928E54b3A578233ad8e343c2";

  // Contract = address + abi + provider
  usdcTkContract = new Contract(usdcAddress, usdcTknAbi, provider);
  bbitesTknContract = new Contract(bbitesTknAdd ,bbitesTokenAbi, provider); // = new Contract(...
  pubSContract = new Contract(pubSContractAdd, publicSaleAbi, provider);
}

function initSCsMumbai() {
  provider = new ethers.BrowserProvider(window.ethereum);

  var nftAddress = "";

  nftContract; // = new Contract(...
}

function setUpListeners() {
  // Connect to Metamask
  var bttn = document.getElementById("connect");
  var walletIdEl = document.getElementById("walletId");
  bttn.addEventListener("click", async function () {
    if (window.ethereum) {
      [account] = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Billetera metamask", account);
      walletIdEl.innerHTML = account;
      signer = await provider.getSigner(account);
    }
  });

  // USDC Balance - balanceOf
  var bttnUSDC = document.getElementById("usdcUpdate");
  bttnUSDC.addEventListener("click", async function () {
    var balance = await usdcTkContract.balanceOf(account);
    var balanceEl = document.getElementById("usdcBalance");
    balanceEl.innerHTML = ethers.formatUnits(balance, 6);
  });

  // Bbites token Balance - balanceOf
  var bttnBBTKN = document.getElementById("bbitesTknUpdate");
  bttnBBTKN.addEventListener("click", async function () {
    var balance = await bbitesTknContract.balanceOf(account);
    var balanceEl = document.getElementById("bbitesTknBalance");
    // console.log("balance BBToken: " + balance);
    balanceEl.innerHTML = ethers.formatUnits(balance, 18);
  });

  // APPROVE BBTKN
  // bbitesTknContract.approve
  var bttnApproveBBTKN = document.getElementById("approveButtonBBTkn");
  bttnApproveBBTKN.addEventListener("click", async function() {
    var approveAmount = document.getElementById("approveInput").value;
    var approveError = document.getElementById("approveError");
    try {
      // console.log(approveAmount);
      approveError.innerHTML = "Approve on Metamask...";
      var tx = await bbitesTknContract.connect(signer).approve(pubSContractAdd, approveAmount);
      approveError.innerHTML = "Waiting response...";
      var response = await tx.wait();
      // console.log("Tx Hash " + response.hash);
      approveError.innerHTML = "Success! Transaction hash: " + response.hash;
    } catch (error) {
      console.log(error.reason);
      approveError.innerHTML = error.reason;
    }
  });

  // APPROVE USDC
  // usdcTkContract.approve
  var bttnApproveUSDC = document.getElementById("approveButtonUSDC");
  bttnApproveUSDC.addEventListener("click", async function() {
    var approveAmount = document.getElementById("approveInputUSDC").value;
    var approveError = document.getElementById("approveErrorUSDC");
    try {
      // console.log(approveAmount);
      approveError.innerHTML = "Approve on Metamask...";
      var tx = await usdcTkContract.connect(signer).approve(pubSContractAdd, approveAmount);
      approveError.innerHTML = "Waiting response...";
      var response = await tx.wait();
      // console.log("Tx Hash " + response.hash);
      approveError.innerHTML = "Success! Transaction hash: " + response.hash;
    } catch (error) {
      console.log(error.reason);
      approveError.innerHTML = error.reason;
    }
  });

  // purchaseWithTokens
  var bttnBuyBBTKN = document.getElementById("purchaseButton");
  bttnBuyBBTKN.addEventListener("click", async() => {
    var tokenId = document.getElementById("purchaseInput").value;
    console.log("token: "+tokenId);
    try {
      purchaseError.innerHTML = "Approve transaction in Metamask...";
      var tx = await pubSContract.connect(signer).purchaseWithTokens(tokenId);
      purchaseError.innerHTML = "Waiting response...";
      var response = await tx.wait();
      console.log("Tx Hash " + response.hash);
      purchaseError.innerHTML = "Success! Transaction hash: " + response.hash;
      
    } catch (error) {
      console.log(error);
      purchaseError.innerHTML = error.reason;
    }

  });

  // purchaseWithUSDC
  var bttn = document.getElementById("purchaseButtonUSDC");

  // purchaseWithEtherAndId
  var bttnBuyEtherId = document.getElementById("purchaseButtonEtherId");
  bttnBuyEtherId.addEventListener("click", async() => {
    var tokenId = document.getElementById("purchaseInputEtherId").value;
    var purchaseError = document.getElementById("purchaseEtherIdError");
    try {
      purchaseError.innerHTML = "Approve transaction in Metamask...";
      var tx = await pubSContract.connect(signer).purchaseWithEtherAndId(tokenId, { value: 0.01 });
      purchaseError.innerHTML = "Waiting response...";
      var response = await tx.wait();
      console.log("Tx Hash " + response.hash);
      purchaseError.innerHTML = "Success! Transaction hash: " + response.hash;
      
    } catch (error) {
      console.log(error);
      purchaseError.innerHTML = error.reason;
    }
  });

  // send Ether
  var bttn = document.getElementById("sendEtherButton");

  // getPriceForId
  var bttnPriceForId = document.getElementById("getPriceNftByIdBttn");
  bttnPriceForId.addEventListener("click", async() => {
    var id = document.getElementById("priceNftIdInput").value;
    try {
      var price = await pubSContract.getPriceForId(id);
      // getPriceNftError.innerHTML = "Waiting response...";
      // var response = await tx.wait();
      getPriceNftError.innerHTML = price;
    } catch (error) {
      getPriceNftError.innerHTML = error.reason;
    }
  });

  // getProofs
  var bttn = document.getElementById("getProofsButtonId");
  bttn.addEventListener("click", async () => {
    var id;
    var address;
    var proofs = merkleTree.getHexProof(hashToken(id, address));
    navigator.clipboard.writeText(JSON.stringify(proofs));
  });

  // safeMintWhiteList
  var bttn = document.getElementById("safeMintWhiteListBttnId");
  // usar ethers.hexlify porque es un array de bytes
  // var proofs = document.getElementById("whiteListToInputProofsId").value;
  // proofs = JSON.parse(proofs).map(ethers.hexlify);

  // buyBack
  var bttn = document.getElementById("buyBackBttn");
}

function setUpEventsContracts() {
  var pubSList = document.getElementById("pubSList");
  // pubSContract - "PurchaseNftWithId"

  var bbitesListEl = document.getElementById("bbitesTList");
  // bbitesCListener - "Transfer"

  var nftList = document.getElementById("nftList");
  // nftCListener - "Transfer"

  var burnList = document.getElementById("burnList");
  // nftCListener - "Burn"
}

async function setUp() {
  window.ethereum.on("chainChanged", (chainId) => {
    window.location.reload();
  });

  initSCsGoerli();

  // initSCsMumbai

  setUpListeners();

  // setUpEventsContracts

  // buildMerkleTree
}

setUp()
  .then()
  .catch((e) => console.log(e));

import { Contract, ethers } from "ethers";
const { MerkleTree } = require("merkletreejs");

var usdcTknAbi = require("../artifacts/contracts/USDCoin.sol/USDCoin.json").abi;
var bbitesTokenAbi = require("../artifacts/contracts/BBitesToken.sol/BBitesToken.json").abi;
var publicSaleAbi = require("../artifacts/contracts/PublicSale.sol/PublicSale.json").abi;
var nftTknAbi = require("../artifacts/contracts/CuyCollectionNft.sol/CuyCollectionNFT.json").abi;

// SUGERENCIA: vuelve a armar el MerkleTree en frontend
// Utiliza la libreria buffer
import buffer from "buffer/";
import walletAndIds from "../wallets/walletList";

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
  var elementosHasheados = walletAndIds.map(({ id, address }) => {
    return hashToken(id, address);
  });;
  merkleTree = new MerkleTree(elementosHasheados, ethers.keccak256, {
    sortPairs: true,
  });
  var root = merkleTree.getHexRoot();
  console.log("root "+root);
  return root;
}

function buildProofs(tokenId, account){
  // var hashedElements, proofs;
  console.log("retrieving root...");
  var root = buildMerkleTree();
  console.log("root");

  var hashedElements = hashToken(tokenId, account);
  var proofs = merkleTree.getHexProof(hashedElements);
  console.log(proofs);
  // return proofs;
  var belongs = merkleTree.verify(proofs, hashedElements, root);
  console.log(belongs);
  return {
    'proofs': proofs,
    'belongs': belongs
  };
}

var provider, signer, account;
var usdcTkContract, bbitesTknContract, pubSContract, nftContract;
var usdcAddress, bbitesTknAdd, pubSContractAdd;

function initSCsGoerli() {
  provider = new ethers.BrowserProvider(window.ethereum);

  usdcAddress = "0xe6666d3bcE86933b4a3b96f364a263d79312dEEc";
  bbitesTknAdd = "0xe9bE45d717b89612f37E6A512ceeC8388A0416Fc";
  pubSContractAdd = "0xfe44A01e4226d6D9E37025786F069A6b168A843a";

  // Contract = address + abi + provider
  usdcTkContract = new Contract(usdcAddress, usdcTknAbi, provider);
  bbitesTknContract = new Contract(bbitesTknAdd ,bbitesTokenAbi, provider); // = new Contract(...
  pubSContract = new Contract(pubSContractAdd, publicSaleAbi, provider);
}

function initSCsMumbai() {
  provider = new ethers.BrowserProvider(window.ethereum);
  var nftAddress = "0xadC7cd04E6693C816ef8d314e526A5684f13D752";
  nftContract = new Contract(nftAddress, nftTknAbi, provider);
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

      // prefill whitelist id
      document.getElementById("inputAccountProofId").value = account;
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
  var bttnBuyEtherRandom = document.getElementById("sendEtherButton");
  bttnBuyEtherRandom.addEventListener("click", async() => {
    var purchaseError = document.getElementById("sendEtherError");
    try {
      purchaseError.innerHTML = "Approve transaction in Metamask...";
      var tx = await pubSContract.connect(signer).depositEthForARandomNft({ value: 0.01 });
      purchaseError.innerHTML = "Waiting response...";
      var response = await tx.wait();
      purchaseError.innerHTML = "Success! Transaction hash: " + response.hash;
      
    } catch (error) {
      console.log(error);
      purchaseError.innerHTML = error.reason;
    }
  });

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

  var btnOwnerforNFTPS = document.getElementById("getOwnerNftByIdBttnPS");
  btnOwnerforNFTPS.addEventListener("click", async() => {
    var getOwnerNFTPS = document.getElementById("getOwnerNftErrorPS");
    var id = document.getElementById("ownerNftIdInputPS").value;
    console.log(id);
    try {
      var owner = await pubSContract.tokenBuyer(id);
      // var response = await tx.wait();
      console.log("owner" + owner);
      getOwnerNFTPS.innerHTML = owner;
    } catch (error) {
      getOwnerNFTPS.innerHTML = error.reason;

    }
    
  });

  var btnOwnerforNFT = document.getElementById("getOwnerNftByIdBttn");
  btnOwnerforNFT.addEventListener("click", async() => {
    var getOwnerNFT = document.getElementById("getOwnerNftError");
    var id = document.getElementById("ownerNftIdInput").value;
    console.log(id);
    try {
      var owner = await nftContract.ownerOf(id);
      // var response = await tx.wait();
      console.log("owner" + owner);
      getOwnerNFT.innerHTML = owner;
    } catch (error) {
      getOwnerNFT.innerHTML = error.reason;

    }
    
  });

  // getProofs
  var bttnProofs = document.getElementById("getProofsButtonId");
  bttnProofs.addEventListener("click", async () => {
    var id = document.getElementById("inputIdProofId").value;
    var address = document.getElementById("inputAccountProofId").value;
    var result = buildProofs(id, address);
    var proofs = result.proofs;
    var belongs = result.belongs;
    var showProofsTextId = document.getElementById("showProofsTextId");
    if (belongs) {
      navigator.clipboard.writeText(JSON.stringify(proofs));
      document.getElementById("whiteListToInputId").value = address;
      document.getElementById("whiteListToInputTokenId").value = id;
      // proofsInput.value = proofs;
      showProofsTextId.innerHTML = proofs;
    }else{
      showProofsTextId.innerHTML = "Combination doesn't belong to whitelisted wallets";
    }
    

  });

  // safeMintWhiteList
  var bttnMintWhitelist = document.getElementById("safeMintWhiteListBttnId");
  bttnMintWhitelist.addEventListener("click", async() => {
  // usar ethers.hexlify porque es un array de bytes
    var proofs = document.getElementById("whiteListToInputProofsId").value;
    proofs = JSON.parse(proofs).map(ethers.hexlify);
    console.log(proofs);
    var purchaseError = document.getElementById("whiteListErrorId");
    try {
      purchaseError.innerHTML = "Approve transaction in Metamask...";
      var account = document.getElementById("whiteListToInputId").value;
      var tokenId = document.getElementById("whiteListToInputTokenId").value;
      var tx = await nftContract.connect(signer).safeMintWhiteList(account, tokenId, proofs);
      purchaseError.innerHTML = "Waiting response...";
      var response = await tx.wait();
      purchaseError.innerHTML = "Success! Transaction hash: " + response.hash;
    } catch (error) {
      console.log(error);
      purchaseError.innerHTML = error.reason;
    }
  });
  

  // buyBack
  var bttnBuyBack = document.getElementById("buyBackBttn");
  bttnBuyBack.addEventListener("click", async() => {
      var tokenId = document.getElementById("buyBackInputId").value;
      console.log(tokenId);
      try {
        buyBackErrorId.innerHTML = "Approve transaction in Metamask...";
        var tx = await nftContract.connect(signer).buyBack(tokenId);
        buyBackErrorId.innerHTML = "Waiting response...";
        var response = await tx.wait();
        buyBackErrorId.innerHTML = "Success! Transaction hash: " + response.hash;
      } catch (error) {
        console.log(error);
        buyBackErrorId.innerHTML = error.reason;
      }
    });
}

function setUpEventsContracts() {
  // var pubSList = document.getElementById("pubSList");
  // // pubSContract - "PurchaseNftWithId"

  // var bbitesListEl = document.getElementById("bbitesTList");
  // // bbitesCListener - "Transfer"

  // var nftList = document.getElementById("nftList");
  // // nftCListener - "Transfer"

  // var burnList = document.getElementById("burnList");
  // nftCListener - "Burn"

  // ====================
  // PurchaseNftWithId(address account, uint256 id)
  pubSContract.on("PurchaseNftWithId", (account, id) => {
    var PSlist = document.getElementById("pubSList");
    var li = document.createElement("li");
    li.appendChild(document.createTextNode("Mint NFT {" + id + "} for account " + account));
    PSlist.appendChild(li);
    console.log("Event PurchaseNftWithId " + id + ", " + account);
  });

  // Transfer(address(0), to, tokenId)
  nftContract.on("Transfer", (owner, account, id) => {
    var nftList = document.getElementById("nftList");
    var li = document.createElement("li");
    li.appendChild(document.createTextNode("Mint NFT {" + id + "} for account " + account));
    nftList.appendChild(li);
    console.log("Event Transfer (mint) " + id + ", " + account);
  });

  // Burn(address account, uint256 id)
  nftContract.on("Burn", (account, id) => {
    var burnList = document.getElementById("burnList");
    var li = document.createElement("li");
    li.appendChild(document.createTextNode("Burn NFT {" + id + "} for account " + account));
    burnList.appendChild(li);
    console.log("Event Burn " + id + ", " + account);
  });

  // Transfer(address(0), account, amount);
  bbitesTknContract.on("Transfer", (owner, account, amount) => {
    var bbitesTList = document.getElementById("bbitesTList");
    var li = document.createElement("li");
    li.appendChild(document.createTextNode("Transfer Tokens {" + ethers.formatUnits(amount, 18) + "} from " + owner +" to account " + account));
    bbitesTList.appendChild(li);
    console.log("Event Transfer " + owner + " -> " + account + ": " + amount);
  });
}

async function setUp() {
  window.ethereum.on("chainChanged", (chainId) => {
    window.location.reload();
  });

  initSCsGoerli();

  initSCsMumbai();

  setUpListeners();

  setUpEventsContracts();
  

  // buildMerkleTree
}

setUp()
  .then()
  .catch((e) => console.log(e));

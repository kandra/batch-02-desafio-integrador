require("dotenv").config();

const {
  getRole,
  verify,
  ex,
  printAddress,
  deploySC,
  deploySCNoUp,
} = require("../utils");

const { getRootFromMT } = require("../utils/merkleTree");

var MINTER_ROLE = getRole("MINTER_ROLE");
var BURNER_ROLE = getRole("BURNER_ROLE");

// Publicar NFT en Mumbai
async function deployMumbai() {
  var relAddMumbai; // relayer mumbai
  // var name = "Chose a name";
  // var symbol = "Chose a symbol";

  // utiliza deploySC
  console.log("Deployando el NFT Cuy...");
  var proxy = await deploySC("CuyCollectionNFT");
  // utiliza printAddress
  console.log("Addresses...")
  var implementationAddress = printAddress("CuyCollectionNFT", await proxy.getAddress());
  // utiliza ex
  // utiliza ex
  // utiliza verify
  console.log("Verifying contract...");
  await verify(implementationAddress, "CuyCollectionNFT");
}

async function verifyNFT(){
  var implAddress = "0x7bb378B39F1730E3aDeAe20033AFbaAA9fC944C4";
  await verify(implAddress, "CuyCollectionNFT");
}

// Publicar UDSC, Public Sale y Bbites Token en Goerli
// async function deployBBTKN() {
//   var relAddGoerli; // relayer goerli

//   console.log("Deployando BBTKN contrato...");
  
//   // var bbitesToken Contrato
//   // deploySC;
//   var proxy = await deploySC("BBitesToken");
//   console.log("Addresses...")
//   var implementationAddress = await printAddress("BBitesToken", await proxy.getAddress());
//   console.log("Verificando...")
//   await verify(implementationAddress, "BBitesToken");
  
//   // var psC Contrato
//   // deploySC;

//   // var impPS = await printAddress("PublicSale", await psC.getAddress());
//   // var impBT = await printAddress("BBitesToken", await bbitesToken.getAddress());

//   // set up
//   // script para verificacion del contrato
// }

async function deployPublicSale() {
  var relAddGoerli; // relayer goerli

  console.log("Deployando PublicSale contrato...");
  
  // var bbitesToken Contrato
  // deploySC;
  var publicSaleContract = await deploySCNoUp("PublicSale");
  console.log("Addresses...")
  var implPublicSale = await publicSaleContract.getAddress();
  console.log("Address: " + implPublicSale);
  console.log("Verificando...")
  await verify(implPublicSale, "PublicSale");
  
  //SET token contract addresses

  // await ex(implPublicSale, setTokenContract, "0xe9bE45d717b89612f37E6A512ceeC8388A0416Fc", messageWhenFailed);
  // await ex(implPublicSale, setUSDCContract, "0xe6666d3bcE86933b4a3b96f364a263d79312dEEc", messageWhenFailed);

  // var psC Contrato
  // deploySC;

  // var impPS = await printAddress("PublicSale", await psC.getAddress());
  // var impBT = await printAddress("BBitesToken", await bbitesToken.getAddress());

  // set up
  // script para verificacion del contrato
}

// deployMumbai()
  // deployGoerli()
  //
  // verifyNFT()
  deployPublicSale()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

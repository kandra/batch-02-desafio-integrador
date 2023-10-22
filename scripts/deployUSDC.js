require("dotenv").config();

const {
  getRole,
  verify,
  ex,
  printAddress,
  deploySC,
  deploySCNoUp,
} = require("../utils");

// const { getRootFromMT } = require("../utils/merkleTree");

var MINTER_ROLE = getRole("MINTER_ROLE");
var BURNER_ROLE = getRole("BURNER_ROLE");

// Publicar UDSC en Goerli
async function deployGoerli() {
  var relAddGoerli; // relayer goerli

  // var usdc Contrato
  console.log("Deployando USDCoin contrato...");
  var usdc_contract = await deploySCNoUp("USDCoin");
  console.log("Retrieving address...");
  var impUSDC = await usdc_contract.getAddress();
  console.log("Address: " + impUSDC);
  // await printAddress("USDCoin", impUSDC);
  await verify(impUSDC, "USDCoin");

}

deployGoerli();
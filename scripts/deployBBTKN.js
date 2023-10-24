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


// Publicar UDSC, Public Sale y Bbites Token en Goerli
async function deployGoerli() {
  var relAddGoerli; // relayer goerli

  // var psC Contrato
  console.log("Deployando BBTKN contrato...");
  var token_contract = await deploySC("BBitesToken");
  console.log("Retrieving address...");
  var impToken = await printAddress("BBitesToken", await token_contract.getAddress());

  // set up
  // script para verificacion del contrato
  console.log("verifying...")
  await verify(impToken, "BBitesToken");
  console.log("Verifying done! :)");
}

deployGoerli()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

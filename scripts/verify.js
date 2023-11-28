require("dotenv").config();

const {
  getRole,
  verify,
  ex,
  printAddress,
  deploySC,
  deploySCNoUp,
} = require("../utils");


async function verifyGoerli(){
  var implementation = "0xe6666d3bcE86933b4a3b96f364a263d79312dEEc";
  console.log("Address: " + implementation);
//   await verify(impUSDC, );
  var contractName = "USDCoin";
  if (!process.env.HARDHAT_NETWORK) return;
  try {
    await hre.run("verify:verify", {
      address: implementation,
      constructorArguments: [],
    });
    console.log("verified ran!");
  } catch (e) {
    if (e.message.includes("Contract source code already verified"))
      console.log(`${contractName} is verified already`);
    else console.error(`Error veryfing - ${contractName}`, e);
  }
}
verifyGoerli();
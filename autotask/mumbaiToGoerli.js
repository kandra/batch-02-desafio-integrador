const { ethers } = require("ethers");
const {
  DefenderRelaySigner,
  DefenderRelayProvider,
} = require("@openzeppelin/defender-relay-client/lib/ethers");

exports.handler = async function (data) {
  const payload = data.request.body.events;

  // Inicializa Proveedor: en este caso es OZP
  const provider = new DefenderRelayProvider(data);

  // Se crea el signer quien será el msg.sender en los smart contracts
  const signer = new DefenderRelaySigner(data, provider, { speed: "fast" });

  // Filtrando solo eventos
  var onlyEvents = payload[0].matchReasons.filter((e) => e.type === "event");
  if (onlyEvents.length === 0) return;

  // Filtrando solo PurchaseNftWithId
  var event = onlyEvents.filter((ev) =>
	  ev.signature.includes("Burn")
  );
  // Mismos params que en el evento
  var { account, id } = event[0].params;
  return event[0];

  // Ejecutar 'mint' en Goerli del contrato 
  var bbTokenAddress = "0xe9bE45d717b89612f37E6A512ceeC8388A0416Fc";
  var tokenAbi = ["function mint(address to, uint256 amount)"];
  var tokenContract = new ethers.Contract(bbTokenAddress, tokenAbi, signer);
  var tx = await tokenContract.mint(account, 10000*10**18);
  var res = await tx.wait();

  return res;

};

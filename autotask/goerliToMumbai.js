const { ethers } = require("ethers");
const {
  DefenderRelaySigner,
  DefenderRelayProvider,
} = require("@openzeppelin/defender-relay-client/lib/ethers");
// } = require("defender-relay-client/lib/ethers");

exports.handler = async function (data) {
  // Eventos que vienen del sentinel
  // Este evento viene de Goerli
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
	  ev.signature.includes("PurchaseNftWithId")
  );
  // Mismos params que en el evento
  var { account, tokenID } = event[0].params;

  // Ejecutar 'mint' en Mumbai del contrato 
  var CuyNFTProxyAddress = "0xadC7cd04E6693C816ef8d314e526A5684f13D752";
  var tokenAbi = ["function safeMint(address to, uint256 tokenId)"];
  var tokenContract = new ethers.Contract(CuyNFTProxyAddress, tokenAbi, signer);
  var tx = await tokenContract.safeMint(account, tokenID);
  var res = await tx.wait();
  console.log(tx.hash);
  return res;

};
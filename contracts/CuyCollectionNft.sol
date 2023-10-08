// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract CuyCollectionNft is ERC721, Pausable, AccessControl, ERC721Burnable {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    bytes32 public root;

    event Burn(address account, uint256 id);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(
        string memory _name,
        string memory _symbol
    ) ERC721(_name, _symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        root = 0x2a1e36609eaef943f74318bdadae71c9de4597fd85fdb1e40c4602aa3ef8d5b6;
    }

    function _baseURI() internal pure override returns (string memory) {
        return "ipfs://QmTWvm55znTX6NmgopdUpJX8CJsNzhGJY4bJVmMvoJP5hA/";
    }

    function safeMint(
        address to,
        uint256 tokenId
    ) public onlyRole(MINTER_ROLE) whenNotPaused(){
        require(tokenId < 1000, "Only allows token IDs from 0 to 999");
        require(_ownerOf(tokenId)==address(0), "Token ID has already been claimed");
        _safeMint(to, tokenId);
    }

    function safeMintWhiteList(
        address to,
        uint256 tokenId,
        bytes32[] calldata proofs
    ) public whenNotPaused{
        bytes32 leaf = keccak256(abi.encodePacked(tokenId, to));
        require(verify(leaf, proofs)==true, "Wallet & Token ID combination is not included in the WhiteList");
        _safeMint(to, tokenId);
    }

    function verify(bytes32 leaf, bytes32[] calldata proofs) public view returns(bool){
        return MerkleProof.verify(proofs, root, leaf);
    }

    function updateMerkleRoot(bytes32 _root) public onlyRole(DEFAULT_ADMIN_ROLE){
        root = _root;
    }

    function buyBack(uint256 id) public {
        require(id>=1000 && id<=1999, "Token ID is not within the 1000 - 1999 range");
        require(ownerOf(id)==msg.sender, "You are not the token's owner");
        burn(id);
        emit Burn(msg.sender, id);
        // Cross chain should emit BBTKN
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // The following functions are overrides required by Solidity.
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

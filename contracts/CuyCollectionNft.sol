// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";


contract CuyCollectionNFT is Initializable, ERC721Upgradeable, ERC721PausableUpgradeable, AccessControlUpgradeable, ERC721BurnableUpgradeable, UUPSUpgradeable {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    bytes32 public root;

    event Burn(address account, uint256 id);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize()
        initializer public
    {
        __ERC721_init("Cuy Collection NFT", "CUYNFT");
        __ERC721Pausable_init();
        __AccessControl_init();
        __ERC721Burnable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        root = 0x2a1e36609eaef943f74318bdadae71c9de4597fd85fdb1e40c4602aa3ef8d5b6;
    }

    function _baseURI() internal pure override returns (string memory) {
        return "ipfs://QmXhXP6zQAzJGaPXGCAf8Xnt17mbYN7HkTAe9f1CDhQARp/";
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function safeMint(address to, uint256 tokenId) public onlyRole(MINTER_ROLE) whenNotPaused {
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

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(UPGRADER_ROLE)
        override
    {}

    // The following functions are overrides required by Solidity.

    // function _update(address to, uint256 tokenId, address auth)
    //     internal
    //     //override(ERC721Upgradeable, ERC721PausableUpgradeable)
    //     override(ERC721Upgradeable)
    //     returns (address)
    // {
    //     return super._update(to, tokenId, auth);
    // }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

/// 
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal override(ERC721PausableUpgradeable, ERC721Upgradeable) whenNotPaused {
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }

}

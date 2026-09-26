// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract HoneyBatch1155 is ERC1155, Ownable {
    enum BatchState {
        None,
        BatchLogged,
        LabAttached,
        AISynthesized,
        TokenMinted,
        PassportGenerated
    }

    struct Batch {
        BatchState state;
        bytes32 reportHash;
        address beekeeper;
        uint64 loggedAt;
        bool mintApproved;
    }

    mapping(uint256 => Batch) public batches;
    mapping(address => bool) public reconcilers;

    event BatchLogged(uint256 indexed tokenId, address indexed beekeeper, bytes32 hardwareReportHash);
    event LabAttached(uint256 indexed tokenId, bytes32 labReportHash);
    event AISynthesized(uint256 indexed tokenId, bytes32 finalReportHash, bool mintApproved);
    event TokenMinted(uint256 indexed tokenId, bytes32 finalReportHash, uint256 amount);
    event PassportGenerated(uint256 indexed tokenId, string passportUri);

    constructor() ERC1155("https://honeychain.example/api/passport/{id}") Ownable(msg.sender) {}

    function setReconciler(address account, bool approved) external onlyOwner {
        reconcilers[account] = approved;
    }

    modifier onlyReconciler() {
        require(reconcilers[msg.sender], "not reconciler");
        _;
    }

    function logBatch(uint256 tokenId, address beekeeper, bytes32 hardwareReportHash) external onlyReconciler {
        require(batches[tokenId].state == BatchState.None, "state");
        Batch storage b = batches[tokenId];
        b.state = BatchState.BatchLogged;
        b.reportHash = hardwareReportHash;
        b.beekeeper = beekeeper;
        b.loggedAt = uint64(block.timestamp);
        emit BatchLogged(tokenId, beekeeper, hardwareReportHash);
    }

    function attachLab(uint256 tokenId, bytes32 labReportHash) external onlyReconciler {
        require(batches[tokenId].state == BatchState.BatchLogged, "state");
        batches[tokenId].state = BatchState.LabAttached;
        emit LabAttached(tokenId, labReportHash);
    }

    function synthesize(uint256 tokenId, bytes32 finalReportHash, bool mintApproved) external onlyReconciler {
        require(batches[tokenId].state == BatchState.LabAttached, "state");
        Batch storage b = batches[tokenId];
        b.state = BatchState.AISynthesized;
        b.reportHash = finalReportHash;
        b.mintApproved = mintApproved;
        emit AISynthesized(tokenId, finalReportHash, mintApproved);
    }

    function mint(uint256 tokenId, uint256 amount) external onlyReconciler {
        Batch storage b = batches[tokenId];
        require(b.state == BatchState.AISynthesized, "state");
        require(b.mintApproved, "mint rejected");
        b.state = BatchState.TokenMinted;
        _mint(b.beekeeper, tokenId, amount, "");
        emit TokenMinted(tokenId, b.reportHash, amount);
    }

    function generatePassport(uint256 tokenId, string calldata passportUri) external onlyReconciler {
        require(batches[tokenId].state == BatchState.TokenMinted, "state");
        batches[tokenId].state = BatchState.PassportGenerated;
        emit PassportGenerated(tokenId, passportUri);
    }
}

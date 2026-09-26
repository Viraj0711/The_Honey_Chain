// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract PollinationEscrow is Ownable {
    mapping(address => bool) public oracles;
    mapping(address => uint256) public uptimeSeconds;
    mapping(address => bool) public claimed;

    uint256 public constant REQUIRED_UPTIME = 30 days;
    uint256 public constant CREDIT_AMOUNT = 1 ether;

    event UptimeReported(address indexed beekeeper, uint256 secondsOnline, uint256 totalUptime);
    event CreditClaimed(address indexed beekeeper, uint256 amount);

    constructor() Ownable(msg.sender) {}

    function setOracle(address account, bool approved) external onlyOwner {
        oracles[account] = approved;
    }

    function reportUptime(address beekeeper, uint256 secondsOnline) external {
        require(oracles[msg.sender], "not oracle");
        uptimeSeconds[beekeeper] += secondsOnline;
        emit UptimeReported(beekeeper, secondsOnline, uptimeSeconds[beekeeper]);
    }

    function claimCredit() external {
        require(!claimed[msg.sender], "already claimed");
        require(uptimeSeconds[msg.sender] >= REQUIRED_UPTIME, "uptime insufficient");
        claimed[msg.sender] = true;
        (bool sent, ) = msg.sender.call{value: CREDIT_AMOUNT}("");
        require(sent, "transfer failed");
        emit CreditClaimed(msg.sender, CREDIT_AMOUNT);
    }

    function fundEscrow() external payable onlyOwner {}

    function escrowBalance() external view returns (uint256) {
        return address(this).balance;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CFL - Crypto Fantasy League
 * @notice Contract for managing deposits, rewards, and user balances in the Crypto Fantasy League
 * @dev Users can deposit native tokens (ETH/MON), and claim rewards based on their performance
 */
contract CFL is ReentrancyGuard, Ownable {
    // ============================================
    // STATE VARIABLES
    // ============================================

    /// @notice Mapping of user address to their total deposit amount
    mapping(address => uint256) public userDeposits;

    /// @notice Mapping of user address to their total claimed rewards
    mapping(address => uint256) public userClaimedRewards;

    /// @notice Mapping of user address to their pending rewards
    mapping(address => uint256) public userPendingRewards;

    /// @notice Total deposits across all users
    uint256 public totalDeposits;

    /// @notice Total rewards distributed
    uint256 public totalRewardsDistributed;

    /// @notice Total pending rewards
    uint256 public totalPendingRewards;

    // ============================================
    // EVENTS
    // ============================================

    /// @notice Emitted when a user deposits native tokens
    /// @param user Address of the user making the deposit
    /// @param amount Amount of native tokens deposited
    /// @param timestamp Block timestamp of the deposit
    event Deposit(address indexed user, uint256 amount, uint256 timestamp);

    /// @notice Emitted when a user claims rewards
    /// @param user Address of the user claiming rewards
    /// @param amount Amount of native tokens claimed
    /// @param timestamp Block timestamp of the claim
    event RewardClaimed(address indexed user, uint256 amount, uint256 timestamp);

    /// @notice Emitted when rewards are added to a user's pending balance
    /// @param user Address of the user receiving rewards
    /// @param amount Amount of native tokens added to pending rewards
    /// @param timestamp Block timestamp of the reward addition
    event RewardAdded(address indexed user, uint256 amount, uint256 timestamp);

    /// @notice Emitted when the owner withdraws tokens from the contract
    /// @param to Address receiving the tokens
    /// @param amount Amount of tokens withdrawn
    /// @param timestamp Block timestamp of the withdrawal
    event Withdrawal(address indexed to, uint256 amount, uint256 timestamp);

    // ============================================
    // CONSTRUCTOR
    // ============================================

    /// @notice Constructor to initialize the CFL contract
    /// @param _owner Address of the contract owner
    constructor(address _owner) Ownable(_owner) {
        require(_owner != address(0), "CFL: Invalid owner address");
    }

    // ============================================
    // USER FUNCTIONS
    // ============================================

    /// @notice Deposit native tokens into the contract
    /// @dev User sends native tokens (ETH/MON) with the transaction
    function deposit() external payable nonReentrant {
        require(msg.value > 0, "CFL: Deposit amount must be greater than 0");

        // Update user deposit mapping
        userDeposits[msg.sender] += msg.value;
        
        // Update total deposits
        totalDeposits += msg.value;

        emit Deposit(msg.sender, msg.value, block.timestamp);
    }

    /// @notice Claim pending rewards
    /// @dev User can claim their accumulated pending rewards
    function claimReward() external nonReentrant {
        uint256 pendingAmount = userPendingRewards[msg.sender];
        require(pendingAmount > 0, "CFL: No pending rewards to claim");

        // Reset pending rewards before transfer to prevent reentrancy
        userPendingRewards[msg.sender] = 0;
        totalPendingRewards -= pendingAmount;

        // Update claimed rewards
        userClaimedRewards[msg.sender] += pendingAmount;
        totalRewardsDistributed += pendingAmount;

        // Transfer rewards to user
        (bool success, ) = payable(msg.sender).call{value: pendingAmount}("");
        require(success, "CFL: Transfer failed");

        emit RewardClaimed(msg.sender, pendingAmount, block.timestamp);
    }

    /// @notice Get user's total balance (deposits + pending rewards)
    /// @param user Address of the user
    /// @return totalBalance Total balance including deposits and pending rewards
    function getUserBalance(address user) external view returns (uint256 totalBalance) {
        return userDeposits[user] + userPendingRewards[user];
    }

    /// @notice Get user's claimable rewards
    /// @param user Address of the user
    /// @return claimableRewards Amount of rewards that can be claimed
    function getClaimableRewards(address user) external view returns (uint256 claimableRewards) {
        return userPendingRewards[user];
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    /// @notice Add rewards to a user's pending balance (only owner)
    /// @param user Address of the user to add rewards to
    /// @param amount Amount of native tokens to add as rewards
    function addReward(address user, uint256 amount) external onlyOwner {
        require(user != address(0), "CFL: Invalid user address");
        require(amount > 0, "CFL: Reward amount must be greater than 0");

        // Check contract has enough balance
        uint256 contractBalance = address(this).balance;
        require(
            contractBalance >= totalPendingRewards + amount,
            "CFL: Insufficient contract balance"
        );

        userPendingRewards[user] += amount;
        totalPendingRewards += amount;

        emit RewardAdded(user, amount, block.timestamp);
    }

    /// @notice Batch add rewards to multiple users (only owner)
    /// @param users Array of user addresses
    /// @param amounts Array of reward amounts corresponding to each user
    function batchAddRewards(address[] calldata users, uint256[] calldata amounts) external onlyOwner {
        require(users.length == amounts.length, "CFL: Arrays length mismatch");
        require(users.length > 0, "CFL: Empty arrays");

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }

        // Check contract has enough balance
        uint256 contractBalance = address(this).balance;
        require(
            contractBalance >= totalPendingRewards + totalAmount,
            "CFL: Insufficient contract balance"
        );

        for (uint256 i = 0; i < users.length; i++) {
            require(users[i] != address(0), "CFL: Invalid user address");
            require(amounts[i] > 0, "CFL: Reward amount must be greater than 0");

            userPendingRewards[users[i]] += amounts[i];
            emit RewardAdded(users[i], amounts[i], block.timestamp);
        }

        totalPendingRewards += totalAmount;
    }

    /// @notice Withdraw native tokens from the contract (only owner)
    /// @param to Address to send the tokens to
    /// @param amount Amount of native tokens to withdraw
    function withdraw(address payable to, uint256 amount) external onlyOwner {
        require(to != address(0), "CFL: Invalid recipient address");
        require(amount > 0, "CFL: Withdrawal amount must be greater than 0");

        // Ensure we don't withdraw more than available (excluding pending rewards)
        uint256 availableBalance = address(this).balance - totalPendingRewards;
        require(amount <= availableBalance, "CFL: Insufficient available balance");

        (bool success, ) = to.call{value: amount}("");
        require(success, "CFL: Transfer failed");

        emit Withdrawal(to, amount, block.timestamp);
    }

    /// @notice Emergency withdraw all tokens (only owner)
    /// @param to Address to send the tokens to
    /// @dev This function should only be used in emergency situations
    function emergencyWithdraw(address payable to) external onlyOwner {
        require(to != address(0), "CFL: Invalid recipient address");
        
        uint256 balance = address(this).balance;
        require(balance > 0, "CFL: No tokens to withdraw");

        (bool success, ) = to.call{value: balance}("");
        require(success, "CFL: Transfer failed");

        emit Withdrawal(to, balance, block.timestamp);
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /// @notice Get contract's native token balance
    /// @return balance Current balance of native tokens in the contract
    function getContractBalance() external view returns (uint256 balance) {
        return address(this).balance;
    }

    /// @notice Get user's deposit information
    /// @param user Address of the user
    /// @return depositAmount Total amount deposited by the user
    /// @return pendingRewards Pending rewards for the user
    /// @return claimedRewards Total rewards claimed by the user
    function getUserInfo(address user)
        external
        view
        returns (
            uint256 depositAmount,
            uint256 pendingRewards,
            uint256 claimedRewards
        )
    {
        return (
            userDeposits[user],
            userPendingRewards[user],
            userClaimedRewards[user]
        );
    }
}


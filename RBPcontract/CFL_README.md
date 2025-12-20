# CFL Contract - Crypto Fantasy League

## Overview

The CFL (Crypto Fantasy League) contract manages deposits, rewards, and user balances for the Crypto Fantasy League platform. Users can deposit MON tokens, and the contract tracks deposits and distributes rewards based on performance.

## Features

- **Deposit MON Tokens**: Users can deposit MON tokens into the contract
- **Reward Management**: Contract tracks pending and claimed rewards for each user
- **User Balance Tracking**: Maintains a mapping of user deposits
- **Batch Operations**: Support for batch reward distribution
- **Security**: Uses OpenZeppelin's ReentrancyGuard and SafeERC20 for secure token transfers

## Contract Functions

### User Functions

#### `deposit(uint256 amount)`
- Deposits MON tokens into the contract
- Updates user deposit mapping
- Requires user to approve the contract to spend MON tokens first

#### `claimReward()`
- Claims pending rewards
- Transfers MON tokens to the user
- Resets pending rewards after claiming

#### `getUserBalance(address user)`
- Returns total balance (deposits + pending rewards) for a user

#### `getClaimableRewards(address user)`
- Returns the amount of rewards that can be claimed by a user

### Admin Functions (Owner Only)

#### `addReward(address user, uint256 amount)`
- Adds rewards to a user's pending balance
- Only callable by the contract owner

#### `batchAddRewards(address[] users, uint256[] amounts)`
- Batch add rewards to multiple users
- More gas efficient for distributing rewards to many users

#### `withdraw(address to, uint256 amount)`
- Withdraws MON tokens from the contract
- Only withdraws available balance (excluding pending rewards)

#### `emergencyWithdraw(address to)`
- Emergency function to withdraw all tokens
- Should only be used in emergency situations

## State Variables

- `monToken`: Address of the MON ERC20 token
- `userDeposits`: Mapping of user address to total deposit amount
- `userPendingRewards`: Mapping of user address to pending rewards
- `userClaimedRewards`: Mapping of user address to total claimed rewards
- `totalDeposits`: Total deposits across all users
- `totalRewardsDistributed`: Total rewards distributed
- `totalPendingRewards`: Total pending rewards

## Events

- `Deposit`: Emitted when a user deposits MON tokens
- `RewardClaimed`: Emitted when a user claims rewards
- `RewardAdded`: Emitted when rewards are added to a user's pending balance
- `Withdrawal`: Emitted when the owner withdraws tokens

## Deployment

### Prerequisites

1. MON token contract address
2. Owner address for the contract

### Using Foundry

```bash
# Set environment variables
export MON_TOKEN_ADDRESS=0x...
export OWNER_ADDRESS=0x...
export PRIVATE_KEY=0x...

# Deploy the contract
forge script script/DeployCFL.s.sol:DeployCFL --rpc-url <RPC_URL> --broadcast --verify
```

### Constructor Parameters

- `_monToken`: Address of the MON ERC20 token contract
- `_owner`: Address of the contract owner

## Usage Example

### Deposit MON Tokens

```solidity
// 1. Approve the contract to spend MON tokens
IERC20(monTokenAddress).approve(cflAddress, amount);

// 2. Deposit tokens
CFL(cflAddress).deposit(amount);
```

### Claim Rewards

```solidity
// Claim pending rewards
CFL(cflAddress).claimReward();
```

### Add Rewards (Owner Only)

```solidity
// Add rewards to a user
CFL(cflAddress).addReward(userAddress, rewardAmount);
```

## Security Considerations

- Uses OpenZeppelin's `ReentrancyGuard` to prevent reentrancy attacks
- Uses `SafeERC20` for safe token transfers
- Owner functions are protected with `onlyOwner` modifier
- Pending rewards are reset before transfer to prevent reentrancy

## Testing

```bash
# Run tests
forge test

# Run tests with gas reporting
forge test --gas-report
```

## License

MIT


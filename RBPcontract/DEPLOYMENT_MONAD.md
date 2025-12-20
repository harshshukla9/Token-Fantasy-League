# CFL Contract Deployment Guide - Monad Network

This guide explains how to deploy the CFL contract to Monad network (Testnet and Mainnet).

## Prerequisites

1. Install Foundry: https://book.getfoundry.sh/getting-started/installation
2. Set up your environment variables
3. Have sufficient MON tokens for gas fees
4. MON token contract address deployed on Monad

## Monad Network Details

### Monad Testnet
- **Chain ID**: 10143
- **RPC URL**: `https://testnet-rpc.monad.xyz` (or check latest from Monad docs)
- **Explorer**: Check Monad documentation for block explorer URL

### Monad Mainnet
- **Chain ID**: 143
- **RPC URL**: `https://mainnet-rpc.monad.xyz` (or check latest from Monad docs)
- **Explorer**: Check Monad documentation for block explorer URL

## Environment Setup

Create a `.env` file in the project root:

```bash
# Required
PRIVATE_KEY=your_private_key_here
MON_TOKEN_ADDRESS=0x...  # Address of MON token contract on Monad

# Optional (defaults to deployer address if not set)
OWNER_ADDRESS=0x...  # Address that will own the CFL contract

# Network Configuration
# For Testnet:
RPC_URL=https://testnet-rpc.monad.xyz
CHAIN_ID=10143

# For Mainnet (uncomment for mainnet):
# RPC_URL=https://mainnet-rpc.monad.xyz
# CHAIN_ID=143
```

## Deployment Steps

### 1. Build the Contract

```bash
cd RBPcontract
forge build
```

### 2. Deploy to Monad Testnet

```bash
forge script script/DeployCFL.s.sol:DeployCFL \
    --rpc-url $RPC_URL \
    --broadcast \
    --verify \
    -vvvv
```

Or with explicit RPC URL:

```bash
forge script script/DeployCFL.s.sol:DeployCFL \
    --rpc-url https://testnet-rpc.monad.xyz \
    --broadcast \
    --verify \
    --chain-id 10143 \
    -vvvv
```

### 3. Deploy to Monad Mainnet

```bash
# Make sure you're using mainnet RPC and chain ID
forge script script/DeployCFL.s.sol:DeployCFL \
    --rpc-url https://mainnet-rpc.monad.xyz \
    --broadcast \
    --verify \
    --chain-id 143 \
    -vvvv
```

## Deployment Script Parameters

The deployment script requires:

- **PRIVATE_KEY**: Private key of the deployer account (must have MON for gas)
- **MON_TOKEN_ADDRESS**: Address of the MON ERC20 token contract on Monad
- **OWNER_ADDRESS** (optional): Address that will own the CFL contract (defaults to deployer)

## Verification

After deployment, verify the contract on Monad block explorer:

```bash
# Get the deployed contract address from the deployment output
# Then verify using Foundry (if supported by Monad explorer)
forge verify-contract \
    <CONTRACT_ADDRESS> \
    src/CFL.sol:CFL \
    --chain-id 10143 \
    --constructor-args $(cast abi-encode "constructor(address,address)" $MON_TOKEN_ADDRESS $OWNER_ADDRESS)
```

## Post-Deployment Checklist

1. **Verify Contract Ownership**
   ```bash
   cast call <CFL_ADDRESS> "owner()" --rpc-url $RPC_URL
   ```

2. **Verify MON Token Address**
   ```bash
   cast call <CFL_ADDRESS> "monToken()" --rpc-url $RPC_URL
   ```

3. **Test Deposit Function**
   - Approve MON tokens: `cast send <MON_TOKEN_ADDRESS> "approve(address,uint256)" <CFL_ADDRESS> <AMOUNT> --rpc-url $RPC_URL --private-key $PRIVATE_KEY`
   - Deposit: `cast send <CFL_ADDRESS> "deposit(uint256)" <AMOUNT> --rpc-url $RPC_URL --private-key $PRIVATE_KEY`

4. **Check User Deposit**
   ```bash
   cast call <CFL_ADDRESS> "userDeposits(address)" <USER_ADDRESS> --rpc-url $RPC_URL
   ```

## Example Deployment Commands

### Testnet Deployment

```bash
# Set environment variables
export PRIVATE_KEY=0x...
export MON_TOKEN_ADDRESS=0x...
export RPC_URL=https://testnet-rpc.monad.xyz

# Deploy
forge script script/DeployCFL.s.sol:DeployCFL \
    --rpc-url $RPC_URL \
    --broadcast \
    --verify \
    --chain-id 10143 \
    -vvvv
```

### Mainnet Deployment

```bash
# Set environment variables
export PRIVATE_KEY=0x...
export MON_TOKEN_ADDRESS=0x...
export OWNER_ADDRESS=0x...  # Optional
export RPC_URL=https://mainnet-rpc.monad.xyz

# Deploy
forge script script/DeployCFL.s.sol:DeployCFL \
    --rpc-url $RPC_URL \
    --broadcast \
    --verify \
    --chain-id 143 \
    -vvvv
```

## Interacting with the Contract

### Deposit MON Tokens

```bash
# 1. Approve CFL contract to spend MON tokens
cast send $MON_TOKEN_ADDRESS \
    "approve(address,uint256)" \
    $CFL_ADDRESS \
    1000000000000000000 \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY

# 2. Deposit tokens
cast send $CFL_ADDRESS \
    "deposit(uint256)" \
    1000000000000000000 \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY
```

### Check User Balance

```bash
cast call $CFL_ADDRESS \
    "getUserBalance(address)" \
    $USER_ADDRESS \
    --rpc-url $RPC_URL
```

### Claim Rewards (Owner)

```bash
cast send $CFL_ADDRESS \
    "addReward(address,uint256)" \
    $USER_ADDRESS \
    500000000000000000 \
    --rpc-url $RPC_URL \
    --private-key $OWNER_PRIVATE_KEY
```

### Claim Rewards (User)

```bash
cast send $CFL_ADDRESS \
    "claimReward()" \
    --rpc-url $RPC_URL \
    --private-key $USER_PRIVATE_KEY
```

## Security Notes

- **Never commit your `.env` file** to version control
- Use a dedicated deployer wallet with minimal funds
- Test thoroughly on testnet before mainnet deployment
- Verify all contracts on block explorer
- Keep your private keys secure
- Use hardware wallets for mainnet deployments

## Troubleshooting

### "Insufficient funds"
- Ensure your deployer address has enough MON tokens for gas fees

### "Nonce too high"
- Reset your nonce or wait for pending transactions to confirm

### "Contract verification failed"
- Ensure the contract was compiled with the same settings
- Check that constructor arguments match exactly
- Verify RPC URL and chain ID are correct

### "Invalid MON token address"
- Ensure MON_TOKEN_ADDRESS is set and is a valid contract address on Monad
- Verify the address is the correct MON token contract

## Network Configuration

### Monad Testnet
- Chain ID: `10143`
- RPC: `https://testnet-rpc.monad.xyz`
- Currency: MON (testnet)

### Monad Mainnet
- Chain ID: `143`
- RPC: `https://mainnet-rpc.monad.xyz`
- Currency: MON

## Support

For issues or questions:
1. Check Monad documentation for latest RPC URLs
2. Verify network configuration
3. Ensure all environment variables are set correctly
4. Test on testnet first


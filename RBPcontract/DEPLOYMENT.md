# Deployment Guide

This guide explains how to deploy the Prediction Market contracts using the provided scripts.

## Prerequisites

1. Install Foundry: https://book.getfoundry.sh/getting-started/installation
2. Set up your environment variables
3. Have sufficient ETH for gas fees

## Environment Setup

Create a `.env` file in the project root:

```bash
PRIVATE_KEY=your_private_key_here
NETWORK=mantle-sepolia  # or mantle-mainnet, localhost, etc.
# Mantle Sepolia Testnet
RPC_URL=https://rpc.sepolia.mantle.xyz
# Mantle Mainnet (uncomment for mainnet)
# RPC_URL=https://rpc.mantle.xyz
```

## Deployment Scripts

### 1. Deploy Factory Only

Deploys the `PredictionMarketFactory` contract:

```bash
forge script script/DeployFactory.s.sol:DeployFactory \
    --rpc-url $RPC_URL \
    --broadcast \
    --verify \
    -vvvv
```

**Output:**
- Factory contract address
- Owner address
- Initial platform fee (2%)

### 2. Deploy Factory + Example Market

Deploys both the factory and creates an example market in one transaction:

```bash
forge script script/DeployAll.s.sol:DeployAll \
    --rpc-url $RPC_URL \
    --broadcast \
    --verify \
    -vvvv
```

**Output:**
- Factory contract address
- Example market address
- Market details

### 3. Create New Market (After Factory is Deployed)

To create a new market after the factory is deployed:

1. Set the factory address in your `.env`:
```bash
FACTORY_ADDRESS=0x...
```

2. Run the deployment script:
```bash
forge script script/DeployMarket.s.sol:DeployMarket \
    --rpc-url $RPC_URL \
    --broadcast \
    --verify \
    -vvvv
```

**Note:** You can modify the market parameters in `DeployMarket.s.sol` before running.

## Script Parameters

### DeployFactory.s.sol
- `INITIAL_PLATFORM_FEE`: 200 basis points (2%)

### DeployMarket.s.sol
- `MARKET_NAME`: "Bitcoin Price Prediction"
- `MIN_VALUE`: 30000 (e.g., $30,000)
- `MAX_VALUE`: 100000 (e.g., $100,000)
- `STEP`: 1000 (e.g., $1,000 increments)
- `INITIAL_VALUE`: 50000 (e.g., $50,000)
- `START_TIME`: 1 day from deployment
- `END_TIME`: 30 days from deployment

### DeployAll.s.sol
- Creates factory and one example market with default parameters

## Local Testing

For local testing with Anvil:

```bash
# Terminal 1: Start Anvil
anvil

# Terminal 2: Deploy
forge script script/DeployAll.s.sol:DeployAll \
    --rpc-url http://localhost:8545 \
    --broadcast \
    --private-key  \
    -vvvv
```

## Verification

After deployment, verify the contracts on Etherscan:

```bash
forge verify-contract \
    <CONTRACT_ADDRESS> \
    src/PredictionMarketFactory.sol:PredictionMarketFactory \
    --etherscan-api-key $ETHERSCAN_API_KEY \
    --chain-id 5003  # Mantle Sepolia Testnet
```

## Post-Deployment

1. **Verify Factory Ownership**: Check that you are the owner
2. **Test Market Creation**: Create a test market
3. **Set Platform Fee**: Adjust if needed (max 10%)
4. **Monitor Events**: Watch for `MarketCreated` events

## Security Notes

- Never commit your `.env` file
- Use a dedicated deployer wallet
- Test on testnets first
- Verify all contracts on block explorers
- Keep your private keys secure

## Troubleshooting

### "Insufficient funds"
- Ensure your deployer address has enough ETH for gas

### "Nonce too high"
- Reset your nonce or wait for pending transactions

### "Contract verification failed"
- Ensure the contract was compiled with the same settings
- Check that the constructor arguments match

## Example Usage

```bash
# 1. Deploy to Mantle Sepolia testnet
forge script script/DeployAll.s.sol:DeployAll \
    --rpc-url https://rpc.sepolia.mantle.xyz \
    --broadcast \
    --verify \
    -vvvv

# 2. Interact with the factory
cast send $FACTORY_ADDRESS "createMarket(...)" \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY

# 3. Check market status
cast call $MARKET_ADDRESS "status()" --rpc-url $RPC_URL
```


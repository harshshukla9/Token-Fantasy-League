#!/bin/bash

# CFL Contract Deployment Script for Monad Network
# Usage: ./deploy-monad.sh [testnet|mainnet]

set -e

NETWORK=${1:-testnet}

if [ "$NETWORK" = "testnet" ]; then
    echo "Deploying to Monad Testnet..."
    RPC_URL=${RPC_URL:-"https://testnet-rpc.monad.xyz"}
    CHAIN_ID=10143
elif [ "$NETWORK" = "mainnet" ]; then
    echo "Deploying to Monad Mainnet..."
    RPC_URL=${RPC_URL:-"https://mainnet-rpc.monad.xyz"}
    CHAIN_ID=143
else
    echo "Invalid network. Use 'testnet' or 'mainnet'"
    exit 1
fi

# Check required environment variables
if [ -z "$PRIVATE_KEY" ]; then
    echo "Error: PRIVATE_KEY environment variable is not set"
    exit 1
fi

echo "Network: $NETWORK"
echo "RPC URL: $RPC_URL"
echo "Chain ID: $CHAIN_ID"
echo "Token: Native (ETH/MON)"
echo "Owner: ${OWNER_ADDRESS:-deployer}"

# Build the contract
echo "Building contract..."
forge build

# Deploy the contract
echo "Deploying CFL contract..."
forge script script/DeployCFL.s.sol:DeployCFL \
    --rpc-url "$RPC_URL" \
    --broadcast \
    --verify \
    --chain-id "$CHAIN_ID" \
    -vvvv

echo "Deployment complete!"


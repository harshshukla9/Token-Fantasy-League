#!/bin/bash

# Test API Endpoints Script
# Run this after starting the application to verify API endpoints work

BASE_URL="http://localhost:3000/api"
TEST_ADDRESS="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"

echo "═══════════════════════════════════════════════════════════"
echo "  Testing CFL API Endpoints"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Test 1: Get Balance
echo "📊 Test 1: Get User Balance"
echo "GET $BASE_URL/balance/$TEST_ADDRESS"
curl -s "$BASE_URL/balance/$TEST_ADDRESS" | jq '.'
echo ""
echo ""

# Test 2: Get Transactions
echo "📜 Test 2: Get User Transactions"
echo "GET $BASE_URL/transactions/$TEST_ADDRESS?limit=5"
curl -s "$BASE_URL/transactions/$TEST_ADDRESS?limit=5" | jq '.'
echo ""
echo ""

# Test 3: Get Leaderboard
echo "🏆 Test 3: Get Leaderboard"
echo "GET $BASE_URL/leaderboard?limit=10"
curl -s "$BASE_URL/leaderboard?limit=10" | jq '.'
echo ""
echo ""

# Test 4: Get Stats
echo "📈 Test 4: Get Platform Stats"
echo "GET $BASE_URL/stats"
curl -s "$BASE_URL/stats" | jq '.'
echo ""
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "  Tests Complete"
echo "═══════════════════════════════════════════════════════════"


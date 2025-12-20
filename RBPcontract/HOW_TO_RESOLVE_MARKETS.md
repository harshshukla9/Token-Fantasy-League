# How to Resolve Markets

## Important: Market Resolution is NOT on the Factory!

The **Factory** only creates markets. To resolve a market, you need to interact with the **individual market contract**.

## Step-by-Step Process

### Step 1: Create a Market (Using Factory)
1. Go to your **PredictionMarketFactory** contract on Etherscan/Remix
2. Call `createMarket()` with your parameters
3. **Copy the returned market address** - this is important!

### Step 2: Resolve the Market (Using Individual Market Contract)
1. Go to the **individual market contract address** (not the factory!)
2. You'll see these functions in the "Write Contract" section:

#### Main Functions Available:
- `resolveMarket(uint256 _finalValue)` - **This is what you need!**
- `cancelMarket()` - Cancel and refund all bets
- `withdrawPlatformFees(address _recipient)` - Withdraw collected fees
- `claimReward()` - Users claim their rewards (after resolution)

### Step 3: Call resolveMarket()

**Function:** `resolveMarket(uint256 _finalValue)`

**Parameters:**
- `_finalValue`: The actual final value of the parameter (must be within minValue and maxValue)

**Requirements:**
- ✅ Market must be Active or Pending
- ✅ Current time must be >= endTime (market must have ended)
- ✅ Final value must be within the range (minValue to maxValue)
- ✅ Only the admin (factory owner) can call this

**Example:**
If your market is for Bitcoin price prediction:
- minValue: 30000
- maxValue: 100000
- If Bitcoin ends at $55,000, call: `resolveMarket(55000)`

## Complete Workflow

```
1. Deploy Factory (once)
   ↓
2. Use Factory.createMarket() → Get Market Address
   ↓
3. Users place bets on Market Address
   ↓
4. Wait for endTime to pass
   ↓
5. Go to Market Address (not Factory!)
   ↓
6. Call resolveMarket(finalValue)
   ↓
7. Rewards are calculated automatically
   ↓
8. Users call claimReward() on Market Address
```

## Finding Your Market Address

### Method 1: From Factory Transaction
1. Go to your factory contract on Etherscan
2. Find the `createMarket` transaction
3. Check the transaction logs for `MarketCreated` event
4. The `marketAddress` in the event is your market contract

### Method 2: From Factory View Function
Call `getAllMarkets()` on the factory to see all market addresses.

### Method 3: From Market ID
Call `getMarket(marketId)` on the factory (marketId starts at 0).

## Example: Resolving a Market

**Market Details:**
- Market Address: `0x1234...5678`
- Parameter: Bitcoin Price
- Range: $30,000 - $100,000
- End Time: Dec 31, 2024

**Steps:**
1. Wait until after Dec 31, 2024
2. Go to `0x1234...5678` on Etherscan
3. Connect wallet (must be factory owner)
4. Go to "Write Contract" tab
5. Find `resolveMarket` function
6. Enter final value: `55000` (if Bitcoin is $55,000)
7. Click "Write" and confirm transaction

**After Resolution:**
- Market status changes to "Resolved"
- Rewards are calculated automatically
- Users can now call `claimReward()` to get their rewards

## Important Notes

⚠️ **You cannot resolve from the Factory contract!**
- The factory doesn't have a `resolveMarket` function
- Each market is a separate contract with its own address

⚠️ **Only Admin Can Resolve**
- The admin is the factory owner
- Make sure you're connected with the owner wallet

⚠️ **Market Must Be Ended**
- You can only resolve after `endTime` has passed
- Check `endTime` using the `getMarketInfo()` view function

## Quick Reference

| Action | Contract to Use | Function |
|--------|----------------|----------|
| Create Market | Factory | `createMarket()` |
| Place Bet | Market | `placeBet()` |
| Resolve Market | Market | `resolveMarket()` |
| Claim Reward | Market | `claimReward()` |
| Cancel Market | Market | `cancelMarket()` |


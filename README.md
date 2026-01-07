# Token Premier League 🏆

**Fantasy crypto gaming on the blockchain** — Create teams of cryptocurrencies, compete in lobbies, and win prizes based on real-time price movements.

## 🎮 What is Token Premier League?

A skill-based fantasy gaming platform where you build teams of cryptocurrencies instead of players. Similar to Dream11, but powered by blockchain and real crypto market data.

## 🎯 How to Play

1. **Connect Wallet** → Link your wallet to Monad network
2. **Join a Lobby** → Choose a contest with entry fee and time window
3. **Build Your Team** → Select **6 cryptocurrencies** from available options
4. **Set Multipliers** → Choose:
   - **Captain** (2× points multiplier)
   - **Vice-Captain** (1.5× points multiplier)
5. **Deposit & Compete** → Pay entry fee and watch your team earn points
6. **Win Prizes** → Top performers on the leaderboard win rewards

## 📊 Scoring System

Points are calculated based on **price percentage change** during the match window:

- **+1% price increase** = +100 points
- **+5% price increase** = +500 points
- **-1% price decrease** = -100 points

**Multipliers:**
- Captain: **2×** points
- Vice-Captain: **1.5×** points

**Example:** If Bitcoin increases 3% and is your Captain → **+600 points** (3% × 100 × 2)

## 🏗️ Project Structure

```
CFL/
├── Frontend/          # Next.js web application
│   ├── src/app/       # Pages and API routes
│   ├── src/components/ # React components
│   └── src/lib/       # Services, database, utilities
└── RBPcontract/       # Solidity smart contracts
    └── src/           # CFL contract (deposits, rewards)
```

## 🚀 Quick Start

### Frontend Setup

```bash
cd Frontend
npm install
cp env.local.example .env.local
# Configure .env.local with your settings
npm run dev
```

### Smart Contracts

```bash
cd RBPcontract
forge build
forge test
```

## 💡 Key Features

- ✅ **Real-time Price Tracking** — Live crypto prices update every second
- ✅ **Blockchain Secured** — All transactions on Monad network
- ✅ **Competitive Lobbies** — Join contests with entry fees and prizes
- ✅ **Live Leaderboards** — See rankings update in real-time
- ✅ **Wallet Integration** — RainbowKit + wagmi support
- ✅ **Reward System** — Claim prizes based on performance

## 🛠️ Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- wagmi + viem + RainbowKit
- MongoDB

**Smart Contracts:**
- Solidity
- Foundry
- OpenZeppelin

**Blockchain:**
- Monad Network

## 📝 License

MIT License


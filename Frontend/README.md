# Crypto Fantasy League

A token-based fantasy gaming platform where users create teams of cryptocurrencies instead of players. Just like Dream11, users select a team, choose a Captain and Vice-Captain, and earn points based on real-time crypto price movements within a fixed match window.

This transforms passive crypto watching into a skill-based, competitive, and rewarding experience.

## 🎯 Core Concepts

Users select **8 cryptocurrencies** to form a fantasy team.

Each team must have:
- **1 Captain** → earns **2× points**
- **1 Vice-Captain** → earns **1.5× points**

Points are calculated purely on **price percentage change**.

Leaderboards determine winners.

## 🧠 Scoring Logic

| Price Movement (per match) | Points |
|----------------------------|--------|
| +1% increase               | +1 point |
| +5% increase               | +5 points |
| −1% decrease               | −1 point |
| −5% decrease               | −5 points |

## Features

- **Fantasy Team Creation**: Select 8 cryptocurrencies for your team
- **Captain & Vice-Captain**: Choose multipliers for maximum points
- **Real-time Price Tracking**: Points calculated from live crypto price movements
- **Leaderboards**: Compete with other players and climb the ranks
- **Wallet Integration**: RainbowKit + wagmi for secure transactions
- **Match Windows**: Fixed time periods for each fantasy match
- **Responsive Design**: Mobile-friendly UI

## Pages

- `/` - Landing page
- `/lobbies` - Dashboard with leaderboard and team management
- `/profile/:address` - User profile and statistics
- `/stress-test` - Stress test interface (admin)

## Components

- `Navbar` - Navigation with wallet connect
- `Leaderboard` - Top fantasy league scores
- `LiveStats` - Real-time statistics
- `ActionPanel` - Team creation and management
- `CustomWalletButton` - Wallet connection component

## Quick Start

### Automated Setup

```bash
# Run setup script
./scripts/setup.sh

# Or manually:
npm install
# or
pnpm install
```

### Configuration

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3002
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet.monad.xyz
NEXT_PUBLIC_MONAD_CHAIN_ID=41454
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

### Development

```bash
# Start dev server
npm run dev
# or
pnpm dev

# Build for production
npm run build
# or
pnpm build

# Start production server
npm start
# or
pnpm start
```

### Other Commands

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Format code
npm run format

# Clean build artifacts
npm run clean
```

## Project Structure

```
Frontend/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── config/          # Configuration files
│   ├── data/            # Mock data
│   ├── shared/          # Shared types, constants, and utilities
│   └── utils/           # Utility functions
├── public/              # Static assets
├── scripts/             # Setup and utility scripts
└── package.json
```

## How It Works

1. **Team Selection**: Users select 8 cryptocurrencies from available options
2. **Captain Selection**: Choose one crypto as Captain (2× multiplier)
3. **Vice-Captain Selection**: Choose one crypto as Vice-Captain (1.5× multiplier)
4. **Match Window**: Each match has a fixed time period (e.g., 24 hours)
5. **Point Calculation**: Points awarded based on price percentage change during match window
6. **Leaderboard**: Rankings updated in real-time based on total points
7. **Rewards**: Top performers win prizes based on leaderboard position

## Scoring Example

If Bitcoin (BTC) increases by 3% during a match:
- Regular team member: +3 points
- If BTC is Vice-Captain: +4.5 points (3 × 1.5)
- If BTC is Captain: +6 points (3 × 2)

## Deployment

### Vercel

Deploy to Vercel:

```bash
vercel --prod
```

The `vercel.json` is already configured for Next.js deployment.

### Build Static Export

```bash
npm run build
# Output in .next/
```

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Wallet**: wagmi + viem + RainbowKit
- **State Management**: React Query
- **Animations**: GSAP, Motion

## Requirements

- Node.js 20+
- npm or pnpm

## License

MIT License

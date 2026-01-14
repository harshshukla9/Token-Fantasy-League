# Lobby Snapshot System Documentation

## Overview

The snapshot system is critical for the fantasy crypto game. It captures cryptocurrency prices at specific moments during a lobby's lifecycle to calculate points fairly.

## How It Works

### Snapshot Types

1. **Start Snapshot** (`snapshotType: 'start'`)
   - Captured when a lobby starts
   - Records the baseline prices for all cryptocurrencies in participants' teams
   - Used as the reference point for calculating percentage changes
   - **Critical**: Without this, points cannot be calculated

2. **Current Snapshot** (`snapshotType: 'current'`)
   - Updated continuously during the lobby
   - Shows real-time prices for leaderboard calculations
   - Stored for each participant

3. **End Snapshot** (`snapshotType: 'end'`)
   - Captured when a lobby ends
   - Locks in final prices for prize distribution
   - Final leaderboard is based on this snapshot

## Architecture

### Price Fetching

#### New Centralized Utility (`/lib/utils/priceFetcher.ts`)

The system now uses a centralized price fetcher with:

- **Retry Logic**: Up to 3 retries per crypto with exponential backoff
- **Timeout Protection**: 8-second timeout per request
- **Batch Processing**: Processes cryptos in batches of 5 to avoid rate limiting
- **Error Isolation**: One crypto failure doesn't affect others
- **Detailed Logging**: Tracks all fetch attempts and failures

```typescript
import { fetchCryptoPrices } from '@/lib/utils/priceFetcher';

// Fetch prices with automatic retry
const prices = await fetchCryptoPrices(['btc', 'eth', 'sol'], {
  retries: 3,
  retryDelay: 1000,
  timeout: 8000,
});
```

### API Endpoints

#### 1. Auto-Snapshot (`/api/lobbies/[lobbyId]/auto-snapshot`)

**Purpose**: Automatically creates snapshots based on lobby timing

**When it runs**:
- Called every minute by the cron job
- Called every minute by frontend when viewing a lobby

**Logic** (Improved):
- **Start Snapshot**: Created anytime after lobby starts if none exists (previously only 30-second window)
- **End Snapshot**: Created within 5 minutes after lobby ends (previously only 30-second window)

**Improvements**:
- More lenient timing windows
- Better error handling with retry logic
- Detailed logging for debugging

#### 2. Update Points (`/api/lobbies/[lobbyId]/update-points`)

**Purpose**: Calculate points for all participants

**Improvements**:
- **Auto-creates start snapshot** if missing (when lobby is active)
- Uses centralized price fetcher with retry logic
- Better error messages
- Warns about missing prices but continues with available data

**Flow**:
```
1. Check if lobby has ended
2. Fetch all participant crypto IDs
3. Fetch current prices (with retry)
4. Check for start snapshot
   → If missing and lobby active: Create one now
5. Calculate points using percentage change
6. Update participant ranks
7. Save current snapshot
```

#### 3. Fix Snapshot (`/api/lobbies/[lobbyId]/fix-snapshot`)

**Purpose**: Manually create or check snapshots

**Usage**:
```bash
# Check snapshot status
GET /api/lobbies/[lobbyId]/fix-snapshot

# Manually create start snapshot
POST /api/lobbies/[lobbyId]/fix-snapshot
```

**When to use**:
- Lobby is stuck without a start snapshot
- Debugging snapshot issues
- Checking snapshot status

#### 4. Cron Job (`/api/cron/update-lobbies`)

**Purpose**: Runs every minute to manage all lobbies

**What it does**:
- Updates lobby statuses
- Triggers auto-snapshots for lobbies that need them
- Distributes prizes for ended lobbies

**Configuration** (`vercel.json`):
```json
{
  "crons": [
    {
      "path": "/api/cron/update-lobbies",
      "schedule": "* * * * *"
    }
  ]
}
```

**Improvements**:
- More lenient snapshot timing (checks if snapshot needed anytime lobby is active)
- Better Vercel authentication handling
- Detailed logging

## Common Issues and Solutions

### Issue 1: "Start snapshot not found"

**Cause**: Snapshot wasn't created when lobby started

**Solutions**:
1. Wait for next cron cycle (happens every minute)
2. Manually create snapshot:
   ```bash
   POST /api/lobbies/[lobbyId]/fix-snapshot
   ```
3. Points update endpoint will auto-create it on next call

### Issue 2: "Failed to fetch BTCUSDT" errors on Vercel

**Cause**: Binance API rate limiting or network issues

**Solution**: 
- System now has retry logic (3 attempts per crypto)
- Batch processing to avoid rate limits
- Extended timeout (8 seconds) for Vercel's serverless environment

**Prevention**:
- Cron job runs regularly to pre-fetch prices
- Frontend calls are throttled (every 10 seconds)

### Issue 3: Lobby started but no snapshot created

**Cause**: Cron job window was missed or API call failed

**Solutions**:
1. Auto-snapshot now checks continuously (not just 30-second window)
2. Update-points endpoint auto-creates snapshot if missing
3. Manual fix endpoint available

## Testing

### Check Snapshot Status

```bash
curl https://your-app.vercel.app/api/lobbies/[lobbyId]/fix-snapshot
```

### Manually Create Snapshot

```bash
curl -X POST https://your-app.vercel.app/api/lobbies/[lobbyId]/fix-snapshot
```

### Test Cron Job Locally

```bash
curl -X GET http://localhost:3000/api/cron/update-lobbies \
  -H "Authorization: Bearer your_cron_secret"
```

## Environment Variables

Required for production:

```env
# Cron job authentication
CRON_SECRET=your_random_secret_here

# Base URL for internal API calls (critical for Vercel)
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
```

## Monitoring

### Logs to Watch

**Success**:
```
Creating start snapshot for lobby [id]
Created 8 start snapshots
Fetching prices for 10 cryptos
```

**Warnings** (non-critical):
```
Missing prices for: matic, dot
Auto-snapshot check failed: [reason]
```

**Errors** (critical):
```
Failed to fetch any prices from Binance API
Start snapshot not found and could not be created
```

### Health Checks

1. **Check if cron is running**:
   - Vercel Dashboard → Project → Cron Jobs
   - Should run every minute

2. **Check snapshot creation**:
   ```bash
   GET /api/lobbies/[lobbyId]/fix-snapshot
   ```
   - Should show `hasStartSnapshot: true` for active lobbies

3. **Check price fetching**:
   - Look for logs in Vercel Functions
   - Should not see consecutive failures

## Best Practices

1. **For Development**:
   - Set `NEXT_PUBLIC_BASE_URL=http://localhost:3000`
   - Monitor console for price fetch errors
   - Test snapshot creation manually

2. **For Production**:
   - Set `NEXT_PUBLIC_BASE_URL` to your Vercel domain
   - Set a strong `CRON_SECRET`
   - Monitor Vercel logs for errors
   - Check cron job execution in Vercel dashboard

3. **Handling Failures**:
   - System is now resilient to partial failures
   - Will continue with available prices
   - Auto-retries on failures
   - Manual fix endpoint available

## Architecture Diagram

```
Lobby Created
     ↓
Participants Join
     ↓
Lobby Starts (startTime)
     ↓
Cron Job (every minute) ──→ Auto-Snapshot ──→ Create Start Snapshot
     ↓                            ↓
     ↓                      Fetch Prices (with retry)
     ↓                            ↓
     ↓                      Save to Database
     ↓
Frontend Polling (every 10s) ──→ Update Points
     ↓                                 ↓
     ↓                           Check Start Snapshot
     ↓                                 ↓
     ↓                           Auto-create if missing
     ↓                                 ↓
     ↓                           Calculate Points
     ↓                                 ↓
     ↓                           Update Ranks
     ↓
Lobby Ends (startTime + interval)
     ↓
Cron Job ──→ Auto-Snapshot ──→ Create End Snapshot
     ↓
Distribute Prizes
     ↓
Lobby Closed
```

## Recent Improvements

### Version 2.0 (Current)

1. **Centralized Price Fetcher**:
   - Retry logic with exponential backoff
   - Batch processing to avoid rate limits
   - Better error handling and logging

2. **Lenient Snapshot Timing**:
   - Start snapshot: Created anytime before lobby ends
   - End snapshot: 5-minute window instead of 30 seconds
   - Auto-creation in update-points if missing

3. **Better Error Messages**:
   - Detailed error responses
   - Frontend shows actual error from API
   - Comprehensive logging

4. **Vercel Optimization**:
   - Increased timeouts for serverless environment
   - Better cron authentication
   - Configured cron in vercel.json

5. **Manual Fix Tools**:
   - New `/fix-snapshot` endpoint
   - Status checking endpoint
   - Debugging utilities

## Future Improvements

1. **Alternative Price Sources**:
   - Add fallback to CoinGecko or other APIs
   - Cache prices in database for redundancy

2. **WebSocket Price Feeds**:
   - Real-time price updates
   - Reduce API call frequency

3. **Price History**:
   - Store historical prices
   - Fallback to recent price if API fails

4. **Alerting**:
   - Notify admins when snapshots fail
   - Monitor API success rates

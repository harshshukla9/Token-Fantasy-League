# Deployment Guide - Snapshot System Fixes

## What Was Fixed

### 1. Price Fetching Issues on Vercel
**Problem**: Binance API calls were failing with "Failed to fetch BTCUSDT" errors

**Solution**:
- Created centralized price fetcher with retry logic (`/lib/utils/priceFetcher.ts`)
- Added exponential backoff (3 retries with increasing delays)
- Increased timeout to 8 seconds for Vercel's serverless environment
- Batch processing to avoid rate limiting

### 2. Missing Start Snapshots
**Problem**: Snapshots only created within 30-second window, easily missed

**Solution**:
- Lenient timing: Creates snapshot anytime after lobby starts
- Auto-creates snapshot in `update-points` if missing
- Added manual fix endpoint: `/api/lobbies/[lobbyId]/fix-snapshot`

### 3. Error Handling
**Problem**: Generic "Failed to update points" error, no details

**Solution**:
- Better error messages throughout the stack
- Detailed logging for debugging
- Frontend now shows actual error from API

## Deployment Steps

### Step 1: Environment Variables

Add these to your Vercel project:

```bash
# In Vercel Dashboard → Settings → Environment Variables

CRON_SECRET=your_random_secret_here_generate_a_strong_one
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
```

**Important**: 
- `CRON_SECRET`: Generate a strong random string (32+ characters)
- `NEXT_PUBLIC_BASE_URL`: Your actual Vercel deployment URL

### Step 2: Deploy to Vercel

```bash
# Push changes to your repository
git add .
git commit -m "Fix: Snapshot system with retry logic and better error handling"
git push origin main
```

Vercel will automatically deploy with the new changes.

### Step 3: Verify Cron Job

1. Go to Vercel Dashboard → Your Project → Cron Jobs
2. You should see: `/api/cron/update-lobbies` running every minute
3. If not showing, the `vercel.json` may need a redeploy

### Step 4: Test the System

#### A. Check Existing Lobby Snapshots

```bash
# Replace [lobbyId] with an actual lobby ID
curl https://your-app.vercel.app/api/lobbies/[lobbyId]/fix-snapshot

# Expected response:
{
  "lobbyId": "...",
  "snapshots": {
    "start": { "exists": true },
    "end": { "exists": false }
  },
  "needsStartSnapshot": false
}
```

#### B. Manually Fix Missing Snapshots

If a lobby shows `"needsStartSnapshot": true`:

```bash
curl -X POST https://your-app.vercel.app/api/lobbies/[lobbyId]/fix-snapshot

# Expected response:
{
  "success": true,
  "message": "Start snapshot created successfully",
  "snapshotsCreated": 8
}
```

#### C. Test Cron Job

```bash
curl https://your-app.vercel.app/api/cron/update-lobbies \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Expected response:
{
  "success": true,
  "checked": 3,
  "processed": 2,
  "results": [...]
}
```

### Step 5: Monitor

#### Check Vercel Logs

1. Vercel Dashboard → Your Project → Logs
2. Look for:
   - ✅ "Creating start snapshot for lobby..."
   - ✅ "Fetching prices for X cryptos"
   - ✅ "Created X start snapshots"
   - ⚠️ "Missing prices for: ..." (warning, but not critical)
   - ❌ "Failed to fetch any prices" (critical - needs investigation)

#### Check Cron Execution

1. Vercel Dashboard → Your Project → Cron Jobs
2. Should show executions every minute
3. Click on recent executions to see logs

## Troubleshooting

### Issue: Cron Job Not Running

**Check**:
1. Is `vercel.json` at the root of your project?
2. Does it contain the `crons` section?
3. Redeploy the project

**Fix**:
```bash
# Ensure vercel.json is correct
cat vercel.json

# Force redeploy
git commit --allow-empty -m "Trigger redeploy"
git push
```

### Issue: "Unauthorized" from Cron Endpoint

**Check**:
- Is `CRON_SECRET` set in Vercel environment variables?
- Is the cron job calling with the correct header?

**Fix**:
1. Vercel Dashboard → Settings → Environment Variables
2. Add `CRON_SECRET` with a strong random value
3. Redeploy

### Issue: Still Getting "Failed to fetch" Errors

**Possible causes**:
1. Binance API is down or rate limiting
2. Network issues from Vercel region
3. Timeout too short

**Check logs**:
```bash
# Look for patterns in Vercel logs
# - Are all cryptos failing?
# - Is it happening at specific times?
# - Are retries working?
```

**Temporary workaround**:
Use the manual fix endpoint to create snapshots when API is working:
```bash
curl -X POST https://your-app.vercel.app/api/lobbies/[lobbyId]/fix-snapshot
```

### Issue: Lobby Shows "Start snapshot not found"

**Quick fix**:
```bash
# Manually create the snapshot
curl -X POST https://your-app.vercel.app/api/lobbies/[lobbyId]/fix-snapshot
```

**Why it happened**:
- Cron job wasn't running at the exact start time
- Price API was down when lobby started
- New lobby created between cron cycles

**Prevention**:
- System now auto-creates snapshot on next update-points call
- Cron job checks continuously, not just at start time

## Testing Locally

### Setup

```bash
# Install dependencies
cd Frontend
npm install

# Copy environment variables
cp env.local.example .env.local

# Edit .env.local
nano .env.local

# Add:
MONGODB_URI=your_mongodb_uri
CRON_SECRET=local_test_secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Run

```bash
# Start development server
npm run dev

# In another terminal, test cron job
curl http://localhost:3000/api/cron/update-lobbies \
  -H "Authorization: Bearer local_test_secret"
```

### Test Snapshot Creation

```bash
# Get lobby ID from your local database
# Then test snapshot creation
curl -X POST http://localhost:3000/api/lobbies/[lobbyId]/fix-snapshot
```

## Rollback Plan

If issues arise after deployment:

### Option 1: Quick Fix
Use manual snapshot creation for affected lobbies:
```bash
curl -X POST https://your-app.vercel.app/api/lobbies/[lobbyId]/fix-snapshot
```

### Option 2: Revert Deployment
1. Vercel Dashboard → Deployments
2. Find previous stable deployment
3. Click "..." → "Promote to Production"

### Option 3: Disable Cron Temporarily
1. Vercel Dashboard → Settings → Cron Jobs
2. Disable the cron job
3. Manually trigger snapshots as needed

## Performance Expectations

### Price Fetching
- **Before**: Single request, no retry, ~1-2 seconds
- **After**: 3 retries, batch processing, ~2-5 seconds (but more reliable)

### Snapshot Creation
- **Before**: 30-second window, often missed
- **After**: Continuous checking, auto-creation, nearly 100% success rate

### Points Updates
- **Before**: Failed if no snapshot
- **After**: Auto-creates snapshot if missing, always succeeds (if prices available)

## Migration Checklist

- [ ] Environment variables set in Vercel
- [ ] Code deployed to Vercel
- [ ] Cron job visible in Vercel dashboard
- [ ] Cron job executing every minute
- [ ] Test snapshot status endpoint
- [ ] Test manual snapshot creation
- [ ] Monitor logs for errors
- [ ] Check existing lobbies have snapshots
- [ ] Fix any lobbies missing snapshots

## Support

If you encounter issues:

1. **Check Logs**: Vercel Dashboard → Logs
2. **Check Snapshots**: Use GET `/api/lobbies/[lobbyId]/fix-snapshot`
3. **Manual Fix**: Use POST `/api/lobbies/[lobbyId]/fix-snapshot`
4. **Review**: See `SNAPSHOT_SYSTEM.md` for detailed architecture

## New Files Added

1. `/lib/utils/priceFetcher.ts` - Centralized price fetching with retry logic
2. `/api/lobbies/[lobbyId]/fix-snapshot/route.ts` - Manual snapshot management
3. `SNAPSHOT_SYSTEM.md` - System documentation
4. `DEPLOYMENT_FIXES.md` - This file

## Files Modified

1. `/api/lobbies/[lobbyId]/update-points/route.ts` - Uses new price fetcher, auto-creates snapshots
2. `/api/lobbies/[lobbyId]/auto-snapshot/route.ts` - Lenient timing, better error handling
3. `/api/cron/update-lobbies/route.ts` - Better authentication, logging
4. `/hooks/useLobbyPoints.ts` - Better error messages
5. `vercel.json` - Added cron configuration
6. `env.local.example` - Added new environment variables

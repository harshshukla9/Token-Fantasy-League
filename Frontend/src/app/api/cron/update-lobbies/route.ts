import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { Lobby } from '@/lib/db/models/Lobby';
import { LobbyParticipant } from '@/lib/db/models/LobbyParticipant';
import { calculateLobbyStatus } from '@/lib/utils/lobbyStatus';

// This endpoint should be called by a cron job every minute
// It checks all active lobbies and triggers snapshots when needed
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret or Vercel cron authentication
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Allow Vercel cron jobs (they have a specific authorization header)
    // or requests with the correct CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // For Vercel cron jobs, check if it's coming from Vercel
      const isVercelCron = authHeader?.startsWith('Bearer ') && process.env.VERCEL === '1';
      if (!isVercelCron) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    await connectDB();

    const now = new Date();
    
    // Get all active lobbies (open or full)
    const activeLobbies = await Lobby.find({
      status: { $in: ['open', 'full'] },
    });

    const results = [];

    for (const lobby of activeLobbies) {
      const startTime = new Date(lobby.startTime);
      // Calculate end time: startTime + interval (in seconds)
      const endTime = new Date(startTime.getTime() + lobby.interval * 1000);

      // Get participant count
      const participantCount = await LobbyParticipant.countDocuments({
        lobbyId: lobby._id,
      });

      // Calculate current status
      const calculatedStatus = calculateLobbyStatus(
        lobby.startTime,
        lobby.interval,
        participantCount,
        lobby.maxParticipants,
        lobby.status
      );

      // Update lobby status if it changed
      if (calculatedStatus !== lobby.status) {
        lobby.status = calculatedStatus;
        await lobby.save();
      }

      // Check if lobby has started and might need a snapshot
      // More lenient: check if lobby has started but hasn't been running for too long
      const timeSinceStart = now.getTime() - startTime.getTime();
      const timeSinceEnd = now.getTime() - endTime.getTime();
      
      // Take start snapshot if lobby has started and is still running
      const shouldTakeStartSnapshot = timeSinceStart >= 0 && now < endTime;
      
      // Take end snapshot if lobby just ended (within last 5 minutes for reliability)
      const shouldTakeEndSnapshot = timeSinceEnd >= 0 && timeSinceEnd <= 300000;

      // Check if lobby has ended and prizes need to be distributed
      const shouldDistributePrizes = calculatedStatus === 'ended' && !lobby.prizesDistributed;

      // Always try to ensure snapshots are created when needed
      if (shouldTakeStartSnapshot || shouldTakeEndSnapshot) {
        try {
          // Call auto-snapshot endpoint
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
          const response = await fetch(
            `${baseUrl}/api/lobbies/${lobby._id}/auto-snapshot`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          const data = await response.json();
          
          // Only add to results if an action was taken
          if (data.action || data.error) {
            results.push({
              lobbyId: lobby._id.toString(),
              lobbyName: lobby.name,
              action: data.action || 'check',
              success: data.success || false,
              message: data.message || data.error,
            });
          }
        } catch (error) {
          console.error(`Error checking snapshot for lobby ${lobby._id}:`, error);
          results.push({
            lobbyId: lobby._id.toString(),
            lobbyName: lobby.name,
            action: 'snapshot-error',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Distribute prizes if lobby just ended
      if (shouldDistributePrizes) {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
          const prizeResponse = await fetch(
            `${baseUrl}/api/lobbies/${lobby._id}/distribute-prizes`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          const prizeData = await prizeResponse.json();
          results.push({
            lobbyId: lobby._id.toString(),
            lobbyName: lobby.name,
            action: 'distribute-prizes',
            success: prizeData.success || false,
            distributed: prizeData.distributed || 0,
          });
        } catch (error) {
          results.push({
            lobbyId: lobby._id.toString(),
            lobbyName: lobby.name,
            action: 'distribute-prizes-error',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      checked: activeLobbies.length,
      processed: results.length,
      results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}



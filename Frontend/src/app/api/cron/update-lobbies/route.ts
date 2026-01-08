import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { Lobby } from '@/lib/db/models/Lobby';

// This endpoint should be called by a cron job every minute
// It checks all active lobbies and triggers snapshots when needed
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

      // Check if lobby just started (within last 60 seconds)
      const timeSinceStart = now.getTime() - startTime.getTime();
      const shouldTakeStartSnapshot = timeSinceStart >= 0 && timeSinceStart <= 60000;

      // Check if lobby just ended (within last 60 seconds)
      const timeSinceEnd = now.getTime() - endTime.getTime();
      const shouldTakeEndSnapshot = timeSinceEnd >= 0 && timeSinceEnd <= 60000;

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
          results.push({
            lobbyId: lobby._id.toString(),
            lobbyName: lobby.name,
            action: data.action || 'none',
            success: data.success || false,
          });
        } catch (error) {
          results.push({
            lobbyId: lobby._id.toString(),
            lobbyName: lobby.name,
            action: 'error',
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



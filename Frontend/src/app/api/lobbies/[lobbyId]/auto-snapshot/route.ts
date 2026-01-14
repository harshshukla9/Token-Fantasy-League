import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { Lobby } from '@/lib/db/models/Lobby';
import { LobbyParticipant } from '@/lib/db/models/LobbyParticipant';
import { PriceSnapshot } from '@/lib/db/models/PriceSnapshot';
import { roundPriceToPrecision } from '@/lib/utils/pricePrecision';
import { fetchCryptoPrices } from '@/lib/utils/priceFetcher';

// POST - Automatically take snapshot based on lobby status
// This should be called periodically or when lobby status changes
export async function POST(
  request: NextRequest,
  { params }: { params: { lobbyId: string } }
) {
  try {
    await connectDB();

    const { lobbyId } = params;

    if (!lobbyId || lobbyId.length !== 24) {
      return NextResponse.json(
        { error: 'Invalid lobby ID' },
        { status: 400 }
      );
    }

    // Get lobby
    const lobby = await Lobby.findById(lobbyId);
    if (!lobby) {
      return NextResponse.json(
        { error: 'Lobby not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    const startTime = new Date(lobby.startTime);
    // Calculate end time: startTime + interval (in seconds)
    const endTime = new Date(startTime.getTime() + lobby.interval * 1000);

    // Get participants first
    const participants = await LobbyParticipant.find({ lobbyId: lobby._id });
    
    if (participants.length === 0) {
      return NextResponse.json({
        message: 'No participants in lobby yet',
      });
    }

    // Collect all crypto IDs
    const allCryptoIds = new Set<string>();
    participants.forEach((p) => {
      p.team.cryptos.forEach((cryptoId) => allCryptoIds.add(cryptoId));
    });

    let snapshotType: 'start' | 'end' | null = null;
    let action = '';

    // Check if lobby has started and needs a start snapshot
    // More lenient timing: anytime after start time if no start snapshot exists
    if (now >= startTime) {
      const existingStart = await PriceSnapshot.findOne({
        lobbyId: lobby._id,
        snapshotType: 'start',
      });

      if (!existingStart) {
        // Only create start snapshot if we're still before end time
        if (now < endTime) {
          snapshotType = 'start';
          action = 'start';
          console.log(`Creating start snapshot for lobby ${lobbyId}`);
        } else {
          console.warn(`Lobby ${lobbyId} already ended without start snapshot`);
        }
      }
    }

    // Check if lobby has ended and needs an end snapshot
    // More lenient timing: anytime after end time if no end snapshot exists
    if (now >= endTime && !snapshotType) {
      const existingEnd = await PriceSnapshot.findOne({
        lobbyId: lobby._id,
        snapshotType: 'end',
      });

      if (!existingEnd) {
        snapshotType = 'end';
        action = 'end';
        console.log(`Creating end snapshot for lobby ${lobbyId}`);
      }
    }

    if (!snapshotType) {
      return NextResponse.json({
        message: 'No snapshot needed at this time',
        lobbyStatus: {
          now: now.toISOString(),
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          hasStartSnapshot: !!(await PriceSnapshot.findOne({ lobbyId: lobby._id, snapshotType: 'start' })),
          hasEndSnapshot: !!(await PriceSnapshot.findOne({ lobbyId: lobby._id, snapshotType: 'end' })),
        },
      });
    }

    // Fetch current prices using centralized utility with retry logic
    console.log(`Fetching prices for ${allCryptoIds.size} cryptos for ${action} snapshot`);
    
    const priceData = await fetchCryptoPrices(Array.from(allCryptoIds), {
      retries: 3,
      retryDelay: 1000,
      timeout: 8000,
    });

    if (priceData.length === 0) {
      console.error('Failed to fetch any prices for snapshot');
      return NextResponse.json(
        { error: 'Failed to fetch current prices for snapshot' },
        { status: 500 }
      );
    }

    // Warn if some prices are missing
    if (priceData.length < allCryptoIds.size) {
      const fetchedIds = new Set(priceData.map(p => p.cryptoId));
      const missing = Array.from(allCryptoIds).filter(id => !fetchedIds.has(id));
      console.warn(`Missing prices for snapshot: ${missing.join(', ')}`);
    }

    const currentPrices = priceData.map(p => ({
      cryptoId: p.cryptoId,
      price: p.price,
    }));

    if (!snapshotType) {
      return NextResponse.json({
        message: 'No snapshot needed at this time',
        lobbyStatus: {
          now: now.toISOString(),
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          hasStartSnapshot: !!(await PriceSnapshot.findOne({ lobbyId: lobby._id, snapshotType: 'start' })),
          hasEndSnapshot: !!(await PriceSnapshot.findOne({ lobbyId: lobby._id, snapshotType: 'end' })),
        },
      });
    }

    // Create snapshots for all participants
    const snapshots = [];
    for (const participant of participants) {
      const participantPrices = participant.team.cryptos.map((cryptoId) => {
        const priceData = currentPrices.find((p) => p.cryptoId === cryptoId);
        // Ensure price is properly rounded to 8 decimal places
        const price = priceData?.price ? roundPriceToPrecision(priceData.price) : 0;
        return {
          cryptoId,
          price,
          isCaptain: participant.team.captain === cryptoId,
          isViceCaptain: participant.team.viceCaptain === cryptoId,
        };
      });

      // Use findOneAndUpdate with upsert to handle race conditions
      try {
        const snapshot = await PriceSnapshot.findOneAndUpdate(
          {
            lobbyId: lobby._id,
            participantId: participant._id,
            snapshotType,
          },
          {
            lobbyId: lobby._id,
            participantId: participant._id,
            address: participant.address,
            snapshotType,
            prices: participantPrices,
            timestamp: new Date(),
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          }
        );

        snapshots.push(snapshot);
      } catch (error: any) {
        // Handle duplicate key error (race condition)
        if (error.code === 11000) {
          // Snapshot already exists, fetch it instead
          const existingSnapshot = await PriceSnapshot.findOne({
            lobbyId: lobby._id,
            participantId: participant._id,
            snapshotType,
          });
          if (existingSnapshot) {
            snapshots.push(existingSnapshot);
          }
        } else {
          throw error;
        }
      }
    }


    return NextResponse.json({
      success: true,
      action,
      snapshotType,
      count: snapshots.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in auto-snapshot:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}



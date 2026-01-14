import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { Lobby } from '@/lib/db/models/Lobby';
import { LobbyParticipant } from '@/lib/db/models/LobbyParticipant';
import { PriceSnapshot } from '@/lib/db/models/PriceSnapshot';
import { roundPriceToPrecision } from '@/lib/utils/pricePrecision';
import { fetchCryptoPrices } from '@/lib/utils/priceFetcher';

/**
 * POST - Manually fix missing start snapshot for a lobby
 * This endpoint should be used when a lobby is missing its start snapshot
 * and needs one created retroactively
 */
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
    const endTime = new Date(startTime.getTime() + lobby.interval * 1000);

    // Check if lobby has ended
    if (now >= endTime) {
      return NextResponse.json(
        { error: 'Cannot create start snapshot for ended lobby. Use end snapshot instead.' },
        { status: 400 }
      );
    }

    // Check if lobby has started
    if (now < startTime) {
      return NextResponse.json(
        { error: 'Cannot create start snapshot for lobby that has not started yet.' },
        { status: 400 }
      );
    }

    // Check if start snapshot already exists
    const existingStart = await PriceSnapshot.findOne({
      lobbyId: lobby._id,
      snapshotType: 'start',
    });

    if (existingStart) {
      return NextResponse.json(
        { 
          message: 'Start snapshot already exists',
          snapshotExists: true,
          timestamp: existingStart.timestamp 
        },
        { status: 200 }
      );
    }

    // Get all participants
    const participants = await LobbyParticipant.find({ lobbyId: lobby._id });
    
    if (participants.length === 0) {
      return NextResponse.json(
        { error: 'No participants found in this lobby' },
        { status: 400 }
      );
    }

    // Collect all crypto IDs
    const allCryptoIds = new Set<string>();
    participants.forEach((p) => {
      p.team.cryptos.forEach((cryptoId) => allCryptoIds.add(cryptoId));
    });

    // Fetch current prices with retry logic
    console.log(`Fetching prices for ${allCryptoIds.size} cryptos to create start snapshot`);
    
    const priceData = await fetchCryptoPrices(Array.from(allCryptoIds), {
      retries: 5,
      retryDelay: 1000,
      timeout: 10000,
    });

    if (priceData.length === 0) {
      return NextResponse.json(
        { error: 'Failed to fetch any prices for snapshot' },
        { status: 500 }
      );
    }

    // Warn if some prices are missing
    const missingPrices: string[] = [];
    if (priceData.length < allCryptoIds.size) {
      const fetchedIds = new Set(priceData.map(p => p.cryptoId));
      Array.from(allCryptoIds).forEach(id => {
        if (!fetchedIds.has(id)) {
          missingPrices.push(id);
        }
      });
      console.warn(`Missing prices for: ${missingPrices.join(', ')}`);
    }

    const currentPrices = priceData.map(p => ({
      cryptoId: p.cryptoId,
      price: p.price,
    }));

    // Create start snapshots for all participants
    const snapshots = [];
    for (const participant of participants) {
      const participantPrices = participant.team.cryptos.map((cryptoId) => {
        const priceData = currentPrices.find((p) => p.cryptoId === cryptoId);
        const price = priceData?.price ? roundPriceToPrecision(priceData.price) : 0;
        return {
          cryptoId,
          price,
          isCaptain: participant.team.captain === cryptoId,
          isViceCaptain: participant.team.viceCaptain === cryptoId,
        };
      });

      try {
        const snapshot = await PriceSnapshot.findOneAndUpdate(
          {
            lobbyId: lobby._id,
            participantId: participant._id,
            snapshotType: 'start',
          },
          {
            lobbyId: lobby._id,
            participantId: participant._id,
            address: participant.address,
            snapshotType: 'start',
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
        // Handle duplicate key error
        if (error.code === 11000) {
          const existingSnapshot = await PriceSnapshot.findOne({
            lobbyId: lobby._id,
            participantId: participant._id,
            snapshotType: 'start',
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
      message: 'Start snapshot created successfully',
      snapshotType: 'start',
      participantCount: participants.length,
      snapshotsCreated: snapshots.length,
      missingPrices: missingPrices.length > 0 ? missingPrices : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fixing snapshot:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Check snapshot status for a lobby
 */
export async function GET(
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
    const endTime = new Date(startTime.getTime() + lobby.interval * 1000);

    // Check for snapshots
    const startSnapshot = await PriceSnapshot.findOne({
      lobbyId: lobby._id,
      snapshotType: 'start',
    });

    const endSnapshot = await PriceSnapshot.findOne({
      lobbyId: lobby._id,
      snapshotType: 'end',
    });

    const participantCount = await LobbyParticipant.countDocuments({
      lobbyId: lobby._id,
    });

    return NextResponse.json({
      lobbyId: lobby._id.toString(),
      lobbyName: lobby.name,
      status: lobby.status,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      now: now.toISOString(),
      hasStarted: now >= startTime,
      hasEnded: now >= endTime,
      participantCount,
      snapshots: {
        start: {
          exists: !!startSnapshot,
          timestamp: startSnapshot?.timestamp.toISOString(),
        },
        end: {
          exists: !!endSnapshot,
          timestamp: endSnapshot?.timestamp.toISOString(),
        },
      },
      needsStartSnapshot: now >= startTime && now < endTime && !startSnapshot,
      needsEndSnapshot: now >= endTime && !endSnapshot,
    });
  } catch (error) {
    console.error('Error checking snapshot status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

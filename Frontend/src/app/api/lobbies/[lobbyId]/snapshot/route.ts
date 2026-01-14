import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { Lobby } from '@/lib/db/models/Lobby';
import { LobbyParticipant } from '@/lib/db/models/LobbyParticipant';
import { PriceSnapshot } from '@/lib/db/models/PriceSnapshot';
import { roundPriceToPrecision } from '@/lib/utils/pricePrecision';
import { fetchCryptoPrices, validatePrices } from '@/lib/utils/priceFetcher';

// POST - Take price snapshot (start, end, or current)
export async function POST(
  request: NextRequest,
  { params }: { params: { lobbyId: string } }
) {
  try {
    await connectDB();

    const { lobbyId } = params;
    const body = await request.json();
    const { snapshotType, prices } = body; // snapshotType: 'start' | 'end' | 'current', prices: { cryptoId, price, isCaptain, isViceCaptain }[]

    if (!lobbyId || lobbyId.length !== 24) {
      return NextResponse.json(
        { error: 'Invalid lobby ID' },
        { status: 400 }
      );
    }

    if (!snapshotType || !['start', 'end', 'current'].includes(snapshotType)) {
      return NextResponse.json(
        { error: 'Invalid snapshot type. Must be start, end, or current' },
        { status: 400 }
      );
    }

    if (!prices || !Array.isArray(prices) || prices.length === 0) {
      return NextResponse.json(
        { error: 'Prices array is required' },
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

    // Get all participants for this lobby
    const participants = await LobbyParticipant.find({
      lobbyId: lobby._id,
    });

    if (participants.length === 0) {
      return NextResponse.json(
        { error: 'No participants found in this lobby' },
        { status: 400 }
      );
    }

    // Create snapshots for all participants
    const snapshots = [];
    for (const participant of participants) {
      // Get participant's team cryptos
      const participantPrices = participant.team.cryptos.map((cryptoId) => {
        const priceData = prices.find((p: any) => p.cryptoId === cryptoId);
        // Ensure price is properly rounded to 8 decimal places for database storage
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
      snapshotType,
      count: snapshots.length,
      snapshots: snapshots.map((s) => ({
        id: s._id.toString(),
        participantId: s.participantId.toString(),
        address: s.address,
        snapshotType: s.snapshotType,
        pricesCount: s.prices.length,
        timestamp: s.timestamp,
      })),
    });
  } catch (error) {
    console.error('Error creating snapshot:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET - Get snapshots for a lobby
export async function GET(
  request: NextRequest,
  { params }: { params: { lobbyId: string } }
) {
  try {
    await connectDB();

    const { lobbyId } = params;
    const { searchParams } = new URL(request.url);
    const snapshotType = searchParams.get('type'); // Optional filter

    if (!lobbyId || lobbyId.length !== 24) {
      return NextResponse.json(
        { error: 'Invalid lobby ID' },
        { status: 400 }
      );
    }

    const query: any = { lobbyId };
    if (snapshotType && ['start', 'end', 'current'].includes(snapshotType)) {
      query.snapshotType = snapshotType;
    }

    const snapshots = await PriceSnapshot.find(query)
      .sort({ timestamp: -1 })
      .lean();

    return NextResponse.json({
      snapshots: snapshots.map((s) => ({
        id: s._id.toString(),
        participantId: s.participantId.toString(),
        address: s.address,
        snapshotType: s.snapshotType,
        prices: s.prices,
        timestamp: s.timestamp,
      })),
      count: snapshots.length,
    });
  } catch (error) {
    console.error('Error fetching snapshots:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


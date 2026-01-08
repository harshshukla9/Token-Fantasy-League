import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { Lobby } from '@/lib/db/models/Lobby';
import { LobbyParticipant } from '@/lib/db/models/LobbyParticipant';
import { PriceSnapshot } from '@/lib/db/models/PriceSnapshot';
import { roundPriceToPrecision } from '@/lib/utils/pricePrecision';

// POST - Calculate and update points for all participants
export async function POST(
  request: NextRequest,
  { params }: { params: { lobbyId: string } }
) {
  try {
    await connectDB();

    const { lobbyId } = params;
    const body = await request.json();
    const { currentPrices } = body; // currentPrices: { cryptoId: string, price: number }[]

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

    // Get all participants
    const participants = await LobbyParticipant.find({
      lobbyId: lobby._id,
    });

    if (participants.length === 0) {
      return NextResponse.json(
        { message: 'No participants to calculate points for' },
        { status: 200 }
      );
    }

    // Get start snapshot (required for calculation)
    const startSnapshots = await PriceSnapshot.find({
      lobbyId: lobby._id,
      snapshotType: 'start',
    }).lean();

    if (startSnapshots.length === 0) {
      return NextResponse.json(
        { error: 'Start snapshot not found. Please take a start snapshot first.' },
        { status: 400 }
      );
    }

    // Create a map of start prices by participant
    const startPriceMap = new Map();
    startSnapshots.forEach((snapshot) => {
      startPriceMap.set(snapshot.participantId.toString(), snapshot.prices);
    });

    // Calculate points for each participant
    const updatedParticipants = [];
    for (const participant of participants) {
      const startPrices = startPriceMap.get(participant._id.toString());
      if (!startPrices || startPrices.length === 0) {
        console.warn(`No start prices found for participant ${participant._id}`);
        continue;
      }

      let totalPoints = 0;

      // Calculate points for each crypto in the team
      for (const startPrice of startPrices) {
        const currentPriceData = currentPrices?.find(
          (p: any) => p.cryptoId === startPrice.cryptoId
        );

        if (!currentPriceData) {
          console.warn(`Current price not found for ${startPrice.cryptoId}`);
          continue;
        }

        const startPriceValue = startPrice.price;
        const currentPriceValue = currentPriceData.price;

        if (startPriceValue === 0) {
          console.warn(`Start price is 0 for ${startPrice.cryptoId}`);
          continue;
        }

        // Calculate percentage change: ((current - start) / start) * 100
        const percentageChange = ((currentPriceValue - startPriceValue) / startPriceValue) * 100;

        // Round to 2 decimal places
        const roundedChange = Math.round(percentageChange * 100) / 100;

        // Apply multipliers
        let points = roundedChange;
        if (startPrice.isCaptain) {
          points = roundedChange * 2; // Captain gets 2x points
        } else if (startPrice.isViceCaptain) {
          points = roundedChange * 1.5; // Vice-Captain gets 1.5x points
        }

        // Round to 2 decimal places
        points = Math.round(points * 100) / 100;
        totalPoints += points;
      }

      // Round total points to 2 decimal places
      totalPoints = Math.round(totalPoints * 100) / 100;

      // Update participant points
      participant.points = totalPoints;
      await participant.save();

      updatedParticipants.push({
        id: participant._id.toString(),
        address: participant.address,
        points: totalPoints,
      });
    }

    // Sort participants by points and update ranks
    const sortedParticipants = await LobbyParticipant.find({
      lobbyId: lobby._id,
    })
      .sort({ points: -1, joinedAt: 1 })
      .lean();

    // Update ranks
    for (let i = 0; i < sortedParticipants.length; i++) {
      await LobbyParticipant.updateOne(
        { _id: sortedParticipants[i]._id },
        { rank: i + 1 }
      );
    }

    console.log(`✅ Calculated and updated points for ${updatedParticipants.length} participants`);

    return NextResponse.json({
      success: true,
      updated: updatedParticipants.length,
      participants: updatedParticipants,
    });
  } catch (error) {
    console.error('Error calculating points:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


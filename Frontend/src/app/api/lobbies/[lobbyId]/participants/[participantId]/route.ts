import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { Lobby } from '@/lib/db/models/Lobby';
import { LobbyParticipant } from '@/lib/db/models/LobbyParticipant';
import { PriceSnapshot } from '@/lib/db/models/PriceSnapshot';

// GET - Get detailed participant information with price performance
export async function GET(
  request: NextRequest,
  { params }: { params: { lobbyId: string; participantId: string } }
) {
  try {
    await connectDB();

    const { lobbyId, participantId } = params;

    if (!lobbyId || lobbyId.length !== 24 || !participantId || participantId.length !== 24) {
      return NextResponse.json(
        { error: 'Invalid lobby or participant ID' },
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

    // Get participant
    const participant = await LobbyParticipant.findById(participantId);
    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    // Verify participant belongs to this lobby
    if (participant.lobbyId.toString() !== lobbyId) {
      return NextResponse.json(
        { error: 'Participant does not belong to this lobby' },
        { status: 400 }
      );
    }

    // Get start snapshot
    const startSnapshot = await PriceSnapshot.findOne({
      lobbyId: lobby._id,
      participantId: participant._id,
      snapshotType: 'start',
    }).lean();

    // Get current snapshot (or end snapshot if lobby ended)
    const currentSnapshot = await PriceSnapshot.findOne({
      lobbyId: lobby._id,
      participantId: participant._id,
      snapshotType: 'current',
    }).lean();

    const endSnapshot = await PriceSnapshot.findOne({
      lobbyId: lobby._id,
      participantId: participant._id,
      snapshotType: 'end',
    }).lean();

    // Use end snapshot if available, otherwise use current
    const latestSnapshot = endSnapshot || currentSnapshot;

    // Calculate performance for each crypto
    const cryptoPerformance = participant.team.cryptos.map((cryptoId) => {
      const startPrice = startSnapshot?.prices.find((p: any) => p.cryptoId === cryptoId);
      const currentPrice = latestSnapshot?.prices.find((p: any) => p.cryptoId === cryptoId);

      const startPriceValue = startPrice?.price || 0;
      const currentPriceValue = currentPrice?.price || 0;

      let percentageChange = 0;
      if (startPriceValue > 0) {
        percentageChange = ((currentPriceValue - startPriceValue) / startPriceValue) * 100;
        percentageChange = Math.round(percentageChange * 100) / 100; // Round to 2 decimals
      }

      // Calculate points for this crypto
      let points = percentageChange;
      if (startPrice?.isCaptain) {
        points = percentageChange * 2;
      } else if (startPrice?.isViceCaptain) {
        points = percentageChange * 1.5;
      }
      points = Math.round(points * 100) / 100;

      return {
        cryptoId,
        isCaptain: startPrice?.isCaptain || false,
        isViceCaptain: startPrice?.isViceCaptain || false,
        startPrice: startPriceValue,
        currentPrice: currentPriceValue,
        percentageChange,
        points,
        priceChange: currentPriceValue - startPriceValue,
      };
    });

    // Get participant rank
    const allParticipants = await LobbyParticipant.find({
      lobbyId: lobby._id,
    })
      .sort({ points: -1, joinedAt: 1 })
      .lean();

    const rank = allParticipants.findIndex((p) => p._id.toString() === participantId) + 1;

    return NextResponse.json({
      participant: {
        id: participant._id.toString(),
        address: participant.address,
        rank,
        points: participant.points,
        joinedAt: participant.joinedAt,
        team: {
          cryptos: participant.team.cryptos,
          captain: participant.team.captain,
          viceCaptain: participant.team.viceCaptain,
        },
      },
      lobby: {
        id: lobby._id.toString(),
        name: lobby.name,
        startTime: lobby.startTime,
        interval: lobby.interval,
      },
      performance: {
        totalPoints: participant.points,
        cryptoPerformance,
        hasStartSnapshot: !!startSnapshot,
        hasCurrentSnapshot: !!latestSnapshot,
        snapshotTimestamp: latestSnapshot?.timestamp || startSnapshot?.timestamp,
      },
    });
  } catch (error) {
    console.error('Error fetching participant details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


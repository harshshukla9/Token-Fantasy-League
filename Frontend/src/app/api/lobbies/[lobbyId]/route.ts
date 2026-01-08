import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { Lobby } from '@/lib/db/models/Lobby';
import { LobbyParticipant } from '@/lib/db/models/LobbyParticipant';
import { calculateLobbyStatus } from '@/lib/utils/lobbyStatus';

// GET - Get single lobby details
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

    const lobby = await Lobby.findById(lobbyId).lean();

    if (!lobby) {
      return NextResponse.json(
        { error: 'Lobby not found' },
        { status: 404 }
      );
    }

    // Get participant count
    const participantCount = await LobbyParticipant.countDocuments({
      lobbyId: lobby._id,
    });

    // Calculate prize pool
    const totalFees = BigInt(lobby.totalFees || '0');
    const prizePool = (totalFees * BigInt(90)) / BigInt(100);
    const protocolFee = (totalFees * BigInt(10)) / BigInt(100);

    // Calculate status based on time and participants
    const status = calculateLobbyStatus(
      lobby.startTime,
      lobby.interval,
      participantCount,
      lobby.maxParticipants,
      lobby.status
    );

    return NextResponse.json({
      id: lobby._id.toString(),
      name: lobby.name,
      depositAmount: lobby.depositAmount,
      currentParticipants: participantCount,
      maxParticipants: lobby.maxParticipants,
      numberOfCoins: lobby.numberOfCoins,
      prizePool: prizePool.toString(),
      protocolFee: protocolFee.toString(),
      totalFees: totalFees.toString(),
      status,
      startTime: lobby.startTime,
      interval: lobby.interval,
      createdBy: lobby.createdBy,
      createdAt: lobby.createdAt,
    });
  } catch (error) {
    console.error('Error fetching lobby:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


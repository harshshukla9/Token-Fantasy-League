import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { Lobby } from '@/lib/db/models/Lobby';
import { LobbyParticipant } from '@/lib/db/models/LobbyParticipant';
import { getPrizeForRank } from '@/lib/utils/prizeDistribution';

// GET - Get all participants for a lobby
export async function GET(
  request: NextRequest,
  { params }: { params: { lobbyId: string } }
) {
  try {
    await connectDB();

    const { lobbyId } = params;
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address'); // Optional: to highlight current user

    if (!lobbyId || lobbyId.length !== 24) {
      return NextResponse.json(
        { error: 'Invalid lobby ID' },
        { status: 400 }
      );
    }

    // Check if lobby exists
    const lobby = await Lobby.findById(lobbyId);
    if (!lobby) {
      return NextResponse.json(
        { error: 'Lobby not found' },
        { status: 404 }
      );
    }

    // Get all participants with their teams
    const participants = await LobbyParticipant.find({
      lobbyId: lobby._id,
    })
      .sort({ points: -1, joinedAt: 1 }) // Sort by points (desc), then by join time
      .lean();

    const totalParticipants = participants.length;
    const prizePool = BigInt(lobby.prizePool || '0');
    const isEnded = lobby.status === 'ended' || lobby.status === 'closed';

    // Format participants with prize information
    const formattedParticipants = participants.map((participant, index) => {
      const rank = index + 1;
      const prizeAmount = getPrizeForRank(rank, totalParticipants, prizePool);
      
      return {
        id: participant._id.toString(),
        address: participant.address,
        team: {
          cryptos: participant.team?.cryptos || [],
          captain: participant.team?.captain || null,
          viceCaptain: participant.team?.viceCaptain || null,
        },
        entryFee: participant.entryFee || '0',
        points: participant.points || 0,
        rank,
        prizeAmount: prizeAmount.toString(),
        hasPrize: prizeAmount > BigInt(0),
        joinedAt: participant.joinedAt,
        isCurrentUser: address ? participant.address.toLowerCase() === address.toLowerCase() : false,
      };
    });

    return NextResponse.json({
      participants: formattedParticipants,
      total: formattedParticipants.length,
      lobby: {
        id: lobby._id.toString(),
        name: lobby.name,
        maxParticipants: lobby.maxParticipants,
        currentParticipants: formattedParticipants.length,
        prizePool: prizePool.toString(),
        status: lobby.status,
        isEnded,
      },
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


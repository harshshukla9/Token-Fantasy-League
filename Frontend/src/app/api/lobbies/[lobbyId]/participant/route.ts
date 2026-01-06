import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { Lobby } from '@/lib/db/models/Lobby';
import { LobbyParticipant } from '@/lib/db/models/LobbyParticipant';

// GET - Get user's participant data for a lobby
export async function GET(
  request: NextRequest,
  { params }: { params: { lobbyId: string } }
) {
  try {
    await connectDB();

    const { lobbyId } = params;
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid address' },
        { status: 400 }
      );
    }

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

    // Find participant
    const participant = await LobbyParticipant.findOne({
      lobbyId: lobby._id,
      address: address.toLowerCase(),
    }).lean();

    if (!participant) {
      return NextResponse.json({
        hasTeam: false,
        participant: null,
      });
    }

    return NextResponse.json({
      hasTeam: true,
      participant: {
        id: participant._id.toString(),
        cryptos: participant.team.cryptos,
        captain: participant.team.captain,
        viceCaptain: participant.team.viceCaptain,
        entryFee: participant.entryFee,
        points: participant.points,
        rank: participant.rank,
        joinedAt: participant.joinedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching participant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


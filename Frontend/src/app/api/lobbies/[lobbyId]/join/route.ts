import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { Lobby } from '@/lib/db/models/Lobby';
import { LobbyParticipant } from '@/lib/db/models/LobbyParticipant';
import { User } from '@/lib/db/models/User';

// POST - Join a lobby
export async function POST(
  request: NextRequest,
  { params }: { params: { lobbyId: string } }
) {
  try {
    const body = await request.json();
    const { address, team } = body; // team: { cryptos: string[], captain: string, viceCaptain: string }

    const { lobbyId } = params;

    console.log('🎮 Join lobby request:', { lobbyId, address });

    // Validate inputs
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    if (!team || !team.cryptos || team.cryptos.length === 0) {
      return NextResponse.json(
        { error: 'Team selection is required' },
        { status: 400 }
      );
    }

    if (!lobbyId || lobbyId.length !== 24) {
      return NextResponse.json(
        { error: 'Invalid lobby ID' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get lobby
    const lobby = await Lobby.findById(lobbyId);
    if (!lobby) {
      return NextResponse.json(
        { error: 'Lobby not found' },
        { status: 404 }
      );
    }

    // Check if lobby is open
    if (lobby.status !== 'open') {
      return NextResponse.json(
        { error: 'Lobby is not open for joining' },
        { status: 400 }
      );
    }

    // Check if already joined
    const existingParticipant = await LobbyParticipant.findOne({
      lobbyId: lobby._id,
      address: address.toLowerCase(),
    });

    if (existingParticipant) {
      return NextResponse.json(
        { error: 'Already joined this lobby' },
        { status: 400 }
      );
    }

    // Check participant count
    const participantCount = await LobbyParticipant.countDocuments({
      lobbyId: lobby._id,
    });

    if (participantCount >= lobby.maxParticipants) {
      // Update lobby status
      lobby.status = 'full';
      await lobby.save();

      return NextResponse.json(
        { error: 'Lobby is full' },
        { status: 400 }
      );
    }

    // Check user balance
    const user = await User.findOne({ address: address.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please deposit funds first.' },
        { status: 400 }
      );
    }

    const userBalance = BigInt(user.balance);
    const entryFee = BigInt(lobby.depositAmount);

    if (userBalance < entryFee) {
      return NextResponse.json(
        {
          error: 'Insufficient balance',
          required: entryFee.toString(),
          current: userBalance.toString(),
        },
        { status: 400 }
      );
    }

    // Deduct entry fee from user balance
    const newBalance = (userBalance - entryFee).toString();
    user.balance = newBalance;
    user.lastUpdated = new Date();
    await user.save();

    console.log(`💰 Deducted ${entryFee.toString()} from ${address}. New balance: ${newBalance}`);

    // Update lobby fees
    const currentTotalFees = BigInt(lobby.totalFees || '0');
    const newTotalFees = currentTotalFees + entryFee;
    lobby.totalFees = newTotalFees.toString();
    lobby.currentParticipants = participantCount + 1;

    // Calculate prize pool (90%) and protocol fee (10%)
    const prizePool = (newTotalFees * BigInt(90)) / BigInt(100);
    const protocolFee = (newTotalFees * BigInt(10)) / BigInt(100);
    lobby.prizePool = prizePool.toString();
    lobby.protocolFee = protocolFee.toString();

    // Check if lobby is now full
    if (lobby.currentParticipants >= lobby.maxParticipants) {
      lobby.status = 'full';
    }

    await lobby.save();

    // Create participant entry
    const participant = await LobbyParticipant.create({
      lobbyId: lobby._id,
      address: address.toLowerCase(),
      team: {
        cryptos: team.cryptos,
        captain: team.captain || null,
        viceCaptain: team.viceCaptain || null,
      },
      entryFee: entryFee.toString(),
      points: 0,
      rank: 0,
      joinedAt: new Date(),
    });

    console.log('✅ User joined lobby:', participant._id);

    return NextResponse.json({
      success: true,
      participant: {
        id: participant._id.toString(),
        lobbyId: lobby._id.toString(),
        address: participant.address,
        entryFee: participant.entryFee,
        joinedAt: participant.joinedAt,
      },
      lobby: {
        id: lobby._id.toString(),
        currentParticipants: lobby.currentParticipants,
        prizePool: lobby.prizePool,
        status: lobby.status,
      },
      user: {
        address: user.address,
        balance: user.balance,
      },
    });
  } catch (error) {
    console.error('❌ Error joining lobby:', error);
    return NextResponse.json(
      {
        error: 'Failed to join lobby',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { Lobby } from '@/lib/db/models/Lobby';
import { LobbyParticipant } from '@/lib/db/models/LobbyParticipant';
import { User } from '@/lib/db/models/User';
import { calculatePrizeDistribution } from '@/lib/utils/prizeDistribution';

// POST - Distribute prizes to winners when lobby ends
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

    // Check if lobby has ended
    if (lobby.status !== 'ended' && lobby.status !== 'closed') {
      return NextResponse.json(
        { error: 'Lobby has not ended yet' },
        { status: 400 }
      );
    }

    // Check if prizes have already been distributed
    if (lobby.prizesDistributed) {
      return NextResponse.json(
        { error: 'Prizes have already been distributed', alreadyDistributed: true },
        { status: 400 }
      );
    }

    // Get all participants sorted by rank
    const participants = await LobbyParticipant.find({
      lobbyId: lobby._id,
    })
      .sort({ points: -1, joinedAt: 1 })
      .lean();

    if (participants.length === 0) {
      return NextResponse.json(
        { error: 'No participants found' },
        { status: 400 }
      );
    }

    const prizePool = BigInt(lobby.prizePool || '0');
    const distribution = calculatePrizeDistribution(participants.length, prizePool);

    // Distribute prizes
    const distributedPrizes = [];
    for (const prizeInfo of distribution) {
      const participant = participants[prizeInfo.rank - 1];
      if (!participant) continue;

      // Find user and update balance
      const user = await User.findOne({ address: participant.address.toLowerCase() });
      if (user) {
        const currentBalance = BigInt(user.balance || '0');
        const newBalance = (currentBalance + prizeInfo.prizeAmount).toString();
        user.balance = newBalance;
        user.lastUpdated = new Date();
        await user.save();

        distributedPrizes.push({
          rank: prizeInfo.rank,
          address: participant.address,
          prizeAmount: prizeInfo.prizeAmount.toString(),
          percentage: prizeInfo.percentage,
        });
      }
    }

    // Mark prizes as distributed
    lobby.prizesDistributed = true;
    lobby.prizesDistributedAt = new Date();
    await lobby.save();

    return NextResponse.json({
      success: true,
      distributed: distributedPrizes.length,
      totalPrizePool: prizePool.toString(),
      prizes: distributedPrizes,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error distributing prizes:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


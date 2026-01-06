import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { Lobby } from '@/lib/db/models/Lobby';
import { LobbyParticipant } from '@/lib/db/models/LobbyParticipant';
import { isAdmin, requireAdmin } from '@/lib/utils/admin';

// GET - Get all lobbies
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = parseInt(searchParams.get('skip') || '0');

    // Build query
    const query: any = {};
    if (status && ['open', 'full', 'closed', 'active', 'ended'].includes(status)) {
      query.status = status;
    }

    // Fetch lobbies
    const lobbies = await Lobby.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    // Calculate current participants and prize pool for each lobby
    const lobbiesWithStats = await Promise.all(
      lobbies.map(async (lobby) => {
        const participantCount = await LobbyParticipant.countDocuments({
          lobbyId: lobby._id,
        });

        // Calculate prize pool (90% of total fees)
        const totalFees = BigInt(lobby.totalFees || '0');
        const prizePool = (totalFees * BigInt(90)) / BigInt(100);
        const protocolFee = (totalFees * BigInt(10)) / BigInt(100);

        // Update status based on participants
        let updatedStatus = lobby.status;
        if (participantCount >= lobby.maxParticipants && lobby.status === 'open') {
          updatedStatus = 'full';
        }

        return {
          id: lobby._id.toString(),
          name: lobby.name,
          depositAmount: lobby.depositAmount,
          currentParticipants: participantCount,
          maxParticipants: lobby.maxParticipants,
          numberOfCoins: lobby.numberOfCoins,
          prizePool: prizePool.toString(),
          protocolFee: protocolFee.toString(),
          totalFees: totalFees.toString(),
          status: updatedStatus,
          startTime: lobby.startTime,
          interval: lobby.interval,
          createdBy: lobby.createdBy,
          createdAt: lobby.createdAt,
        };
      })
    );

    const total = await Lobby.countDocuments(query);

    return NextResponse.json({
      lobbies: lobbiesWithStats,
      total,
      limit,
      skip,
    });
  } catch (error) {
    console.error('Error fetching lobbies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new lobby (Admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, depositAmount, maxParticipants, numberOfCoins, startTime, interval, createdBy } = body;

    // Validate admin
    if (!isAdmin(createdBy)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!name || !depositAmount || !maxParticipants || !startTime || !interval || !createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate deposit amount
    if (BigInt(depositAmount) <= 0) {
      return NextResponse.json(
        { error: 'Deposit amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Validate max participants
    if (maxParticipants < 1) {
      return NextResponse.json(
        { error: 'Max participants must be at least 1' },
        { status: 400 }
      );
    }

    await connectDB();

    // Create lobby
    const lobby = await Lobby.create({
      name,
      depositAmount: depositAmount.toString(),
      maxParticipants,
      numberOfCoins: numberOfCoins || 8,
      startTime: new Date(startTime),
      interval,
      status: 'open',
      currentParticipants: 0,
      totalFees: '0',
      prizePool: '0',
      protocolFee: '0',
      createdBy: createdBy.toLowerCase(),
    });

    console.log('✅ Lobby created:', lobby._id);

    return NextResponse.json({
      success: true,
      lobby: {
        id: lobby._id.toString(),
        name: lobby.name,
        depositAmount: lobby.depositAmount,
        maxParticipants: lobby.maxParticipants,
        numberOfCoins: lobby.numberOfCoins,
        startTime: lobby.startTime,
        interval: lobby.interval,
        status: lobby.status,
        createdBy: lobby.createdBy,
      },
    });
  } catch (error) {
    console.error('Error creating lobby:', error);
    return NextResponse.json(
      {
        error: 'Failed to create lobby',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


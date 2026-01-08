import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { Lobby } from '@/lib/db/models/Lobby';
import { LobbyParticipant } from '@/lib/db/models/LobbyParticipant';
import { User } from '@/lib/db/models/User';
import { calculateLobbyStatus, canCreateTeam } from '@/lib/utils/lobbyStatus';
import { createPublicClient, http, defineChain } from 'viem';
import { CONTRACT_ADDRESSES } from '@/shared/constants';

const mantleSepolia = defineChain({
  id: 5003,
  name: 'Mantle Sepolia Testnet',
  nativeCurrency: { decimals: 18, name: 'MNT', symbol: 'MNT' },
  rpcUrls: {
    default: { http: [process.env.RPC_URL || 'https://rpc.sepolia.mantle.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Mantle Sepolia Explorer', url: 'https://sepolia.mantlescan.xyz' },
  },
  testnet: true,
});

export async function POST(
  request: NextRequest,
  { params }: { params: { lobbyId: string } }
) {
  try {
    const body = await request.json();
    const { address, team, transactionHash } = body;
    const { lobbyId } = params;

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

    // Check participant count (moved before status calculation)
    const participantCount = await LobbyParticipant.countDocuments({
      lobbyId: lobby._id,
    });

    // Calculate current status
    const currentStatus = calculateLobbyStatus(
      lobby.startTime,
      lobby.interval,
      participantCount,
      lobby.maxParticipants,
      lobby.status
    );

    // Check if team creation is allowed (only when status is 'open')
    if (!canCreateTeam(currentStatus)) {
      return NextResponse.json(
        { 
          error: `Lobby is ${currentStatus}. Team creation is only allowed when lobby is open.`,
          status: currentStatus
        },
        { status: 400 }
      );
    }

    if (participantCount >= lobby.maxParticipants) {
      // Update lobby status
      lobby.status = 'full';
      await lobby.save();

      return NextResponse.json(
        { error: 'Lobby is full' },
        { status: 400 }
      );
    }

    // Entry fee for this lobby
    const entryFee = BigInt(lobby.depositAmount);
    let user: any = null;

    // Verify on-chain transaction
    if (transactionHash) {
      try {
        const rpcUrl = process.env.RPC_URL || 'https://rpc.sepolia.mantle.xyz';
        const publicClient = createPublicClient({
          chain: mantleSepolia,
          transport: http(rpcUrl),
        });

        const receipt = await publicClient.getTransactionReceipt({
          hash: transactionHash as `0x${string}`,
        });

        if (!receipt) {
          return NextResponse.json(
            { error: 'Transaction receipt not found. Please wait for confirmation.' },
            { status: 400 }
          );
        }

        if (receipt.status !== 'success') {
          return NextResponse.json(
            { error: 'Transaction failed on blockchain' },
            { status: 400 }
          );
        }

        const depositAddress = CONTRACT_ADDRESSES.DEPOSIT.toLowerCase();
        if (receipt.to?.toLowerCase() !== depositAddress) {
          return NextResponse.json(
            { error: 'Transaction is not to the Deposit contract' },
            { status: 400 }
          );
        }

        if (receipt.from.toLowerCase() !== address.toLowerCase()) {
          return NextResponse.json(
            { error: 'Transaction sender does not match user address' },
            { status: 400 }
          );
        }

        const tx = await publicClient.getTransaction({
          hash: transactionHash as `0x${string}`,
        });

        if (tx.value < entryFee) {
          return NextResponse.json(
            { error: 'Transaction amount is less than required entry fee' },
            { status: 400 }
          );
        }

        // Find or create user
        user = await User.findOne({ address: address.toLowerCase() });
        if (!user) {
          user = await User.create({
            address: address.toLowerCase(),
            balance: '0',
            totalDeposited: tx.value.toString(),
            lastUpdated: new Date(),
          });
        }
      } catch (error) {
        console.error('Transaction verification error:', error);
        return NextResponse.json(
          { error: 'Failed to verify transaction' },
          { status: 500 }
        );
      }
    } else {
      // Fallback: Check user balance
      user = await User.findOne({ address: address.toLowerCase() });
      if (!user) {
        return NextResponse.json(
          { error: 'User not found. Please deposit funds first.' },
          { status: 400 }
        );
      }

      const userBalance = BigInt(user.balance || '0');
      if (userBalance < entryFee) {
        return NextResponse.json(
          { error: 'Insufficient balance' },
          { status: 400 }
        );
      }

      // Deduct entry fee
      user.balance = (userBalance - entryFee).toString();
      user.lastUpdated = new Date();
      await user.save();
    }

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

    // Update lobby status based on current state
    const newStatus = calculateLobbyStatus(
      lobby.startTime,
      lobby.interval,
      lobby.currentParticipants,
      lobby.maxParticipants,
      lobby.status
    );
    lobby.status = newStatus;

    await lobby.save();

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
      transactionHash: transactionHash || null,
    });
  } catch (error) {
    console.error('Error joining lobby:', error);
    return NextResponse.json(
      {
        error: 'Failed to join lobby',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


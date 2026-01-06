import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Transaction } from '@/lib/db/models/Transaction';
import { DepositABI } from '@/abis/Deposit';
import { CONTRACT_ADDRESSES } from '@/shared/constants';

const RPC_URL = process.env.RPC_URL || 'https://rpc.sepolia.mantle.xyz';

const mantleSepolia = {
  id: 5003,
  name: 'Mantle Sepolia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MNT',
    symbol: 'MNT',
  },
  rpcUrls: {
    default: { http: [RPC_URL] },
    public: { http: [RPC_URL] },
  },
  testnet: true,
};

export async function POST(req: NextRequest) {
  try {
    const { walletAddress } = await req.json();

    if (!walletAddress) {
      return NextResponse.json({ error: 'walletAddress is required' }, { status: 400 });
    }

    console.log('🔄 Syncing deposits for:', walletAddress);

    // Connect to database
    await connectDB();

    // Create RPC client
    const client = createPublicClient({
      chain: mantleSepolia as any,
      transport: http(RPC_URL),
    });

    // Get current block
    const currentBlock = await client.getBlockNumber();
    const fromBlock = currentBlock - BigInt(10000); // Last 10k blocks

    console.log(`📊 Fetching events from block ${fromBlock} to ${currentBlock}`);

    // Fetch all deposit events
    const logs = await client.getLogs({
      address: CONTRACT_ADDRESSES.DEPOSIT as `0x${string}`,
      event: parseAbiItem('event Deposited(address indexed player, uint256 amount, uint256 timestamp)'),
      fromBlock,
      toBlock: currentBlock,
      args: {
        player: walletAddress.toLowerCase() as `0x${string}`,
      },
    });

    console.log(`📋 Found ${logs.length} deposit events`);

    let totalSynced = 0;
    let totalAmount = BigInt(0);

    // Process each event
    for (const log of logs) {
      const { player, amount, timestamp } = log.args as any;
      const txHash = log.transactionHash;
      const blockNumber = log.blockNumber;

      // Check if already processed
      const existingTx = await Transaction.findOne({ txHash });
      if (existingTx) {
        console.log(`⏭️  Skipping already processed tx: ${txHash}`);
        continue;
      }

      // Update or create user
      let user = await User.findOne({ address: player.toLowerCase() });
      
      if (user) {
        const oldBalance = BigInt(user.balance);
        const newBalance = (oldBalance + BigInt(amount.toString())).toString();
        user.balance = newBalance;
        user.lastUpdated = new Date();
        await user.save();
      } else {
        user = await User.create({
          address: player.toLowerCase(),
          balance: amount.toString(),
          lastUpdated: new Date(),
        });
      }

      // Record transaction
      await Transaction.create({
        address: player.toLowerCase(),
        amount: amount.toString(),
        txHash,
        blockNumber,
        timestamp: new Date(Number(timestamp) * 1000),
      });

      totalSynced++;
      totalAmount += BigInt(amount.toString());

      console.log(`✅ Synced deposit: ${amount.toString()} wei (tx: ${txHash})`);
    }

    // Get final user balance
    const finalUser = await User.findOne({ address: walletAddress.toLowerCase() });

    return NextResponse.json({
      success: true,
      synced: totalSynced,
      totalAmount: totalAmount.toString(),
      balance: finalUser?.balance || '0',
      message: `Synced ${totalSynced} deposit(s)`,
    });
  } catch (error) {
    console.error('❌ Sync error:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync deposits',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


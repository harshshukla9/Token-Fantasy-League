import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { Transaction } from '@/lib/db/models/Transaction';
import { createPublicClient, http, Address, defineChain } from 'viem';

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

// Create public client for verifying transactions
const publicClient = createPublicClient({
  chain: mantleSepolia,
  transport: http(process.env.RPC_URL || 'https://rpc.sepolia.mantle.xyz'),
});

/**
 * POST /api/withdraw/confirm
 * 
 * Confirm a successful withdrawal:
 * 1. Verify the transaction on-chain
 * 2. Record the transaction in history
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { address, amount, txHash } = body;

    // Validate required fields
    if (!address || !amount || !txHash) {
      return NextResponse.json(
        { error: 'Missing required fields: address, amount, and txHash' },
        { status: 400 }
      );
    }

    // Check if transaction already recorded
    const existingTx = await Transaction.findOne({ txHash: txHash.toLowerCase() });
    if (existingTx) {
      return NextResponse.json({
        success: true,
        message: 'Transaction already recorded',
        transaction: existingTx,
      });
    }

    // Verify the transaction on-chain
    let receipt;
    try {
      receipt = await publicClient.getTransactionReceipt({
        hash: txHash as Address,
      });
    } catch (error) {
      // Transaction might not be mined yet, just record it as pending
      console.error('Failed to get transaction receipt:', error);
    }

    // Record the transaction
    const transaction = await Transaction.create({
      address: address.toLowerCase(),
      amount: amount.toString(),
      txHash: txHash.toLowerCase(),
      blockNumber: receipt?.blockNumber || 0n,
      timestamp: new Date(),
      type: 'withdraw',
      status: receipt?.status === 'success' ? 'confirmed' : (receipt ? 'failed' : 'pending'),
    });

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction._id.toString(),
        address: transaction.address,
        amount: transaction.amount,
        txHash: transaction.txHash,
        type: transaction.type,
        status: transaction.status,
        timestamp: transaction.timestamp,
      },
    });
  } catch (error) {
    console.error('Withdraw confirm error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to confirm withdrawal', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}


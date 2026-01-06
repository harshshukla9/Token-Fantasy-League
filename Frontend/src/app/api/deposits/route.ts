import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Transaction } from '@/lib/db/models/Transaction';

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, amount, transactionHash, blockNumber, timestamp } = await req.json();

    console.log('📥 Received deposit request:', {
      walletAddress,
      amount,
      transactionHash,
      blockNumber,
    });

    // Validate essential fields
    if (!walletAddress || !amount || !transactionHash) {
      console.log('❌ Missing essential fields');
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, amount, or transactionHash' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Check if transaction already exists (prevent duplicates)
    const existingTx = await Transaction.findOne({ txHash: transactionHash });
    if (existingTx) {
      console.log('⚠️  Transaction already processed:', transactionHash);
      return NextResponse.json({
        success: true,
        message: 'Transaction already processed',
        user: await User.findOne({ address: walletAddress.toLowerCase() }),
      });
    }

    // Parse the deposit amount (it comes as string from wei)
    const depositAmount = amount.toString();

    // Find or create user
    console.log('🔍 Searching for user:', walletAddress.toLowerCase());
    let user = await User.findOne({ address: walletAddress.toLowerCase() });

    if (user) {
      // User exists - update their balance
      console.log('📝 Updating existing user...');
      console.log('💰 Current balance:', user.balance);
      console.log('💸 Adding deposit amount:', depositAmount);

      const oldBalance = BigInt(user.balance);
      const newBalance = (oldBalance + BigInt(depositAmount)).toString();

      user.balance = newBalance;
      user.lastUpdated = new Date();
      await user.save();

      console.log('✅ User updated!');
      console.log('💰 New balance:', newBalance);
    } else {
      // User doesn't exist - create new user
      console.log('🆕 Creating new user...');
      console.log('👤 Wallet:', walletAddress.toLowerCase());
      console.log('💰 Initial balance:', depositAmount);

      user = await User.create({
        address: walletAddress.toLowerCase(),
        balance: depositAmount,
        lastUpdated: new Date(),
      });

      console.log('✅ New user created!');
      console.log('💰 Balance:', user.balance);
    }

    // Record transaction
    console.log('📝 Recording transaction...');
    await Transaction.create({
      address: walletAddress.toLowerCase(),
      amount: depositAmount,
      txHash: transactionHash,
      blockNumber: BigInt(blockNumber || '0'),
      timestamp: timestamp ? new Date(Number(timestamp) * 1000) : new Date(),
    });

    console.log('✅ Transaction recorded!');

    return NextResponse.json({
      success: true,
      user: {
        address: user.address,
        balance: user.balance,
        lastUpdated: user.lastUpdated,
      },
      transactionHash,
    });
  } catch (error) {
    console.error('❌ Deposit API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to save deposit to database',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


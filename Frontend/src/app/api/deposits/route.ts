import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Transaction } from '@/lib/db/models/Transaction';

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, amount, transactionHash, blockNumber, timestamp } = await req.json();

    if (!walletAddress || !amount || !transactionHash) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, amount, or transactionHash' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check for duplicate transaction
    const existingTx = await Transaction.findOne({ txHash: transactionHash });
    if (existingTx) {
      return NextResponse.json({
        success: true,
        message: 'Transaction already processed',
        user: await User.findOne({ address: walletAddress.toLowerCase() }),
      });
    }

    const depositAmount = amount.toString();
    let user = await User.findOne({ address: walletAddress.toLowerCase() });

    if (user) {
      const oldBalance = BigInt(user.balance);
      const newBalance = (oldBalance + BigInt(depositAmount)).toString();
      user.balance = newBalance;
      user.lastUpdated = new Date();
      await user.save();
    } else {
      user = await User.create({
        address: walletAddress.toLowerCase(),
        balance: depositAmount,
        lastUpdated: new Date(),
      });
    }

    await Transaction.create({
      address: walletAddress.toLowerCase(),
      amount: depositAmount,
      txHash: transactionHash,
      blockNumber: BigInt(blockNumber || '0'),
      timestamp: timestamp ? new Date(Number(timestamp) * 1000) : new Date(),
    });

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
    console.error('Deposit API error:', error);
    return NextResponse.json(
      { error: 'Failed to save deposit to database' },
      { status: 500 }
    );
  }
}

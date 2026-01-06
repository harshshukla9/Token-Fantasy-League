import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Transaction } from '@/lib/db/models/Transaction';

export async function GET() {
  try {
    await connectDB();

    const [totalUsers, totalTransactions, users] = await Promise.all([
      User.countDocuments(),
      Transaction.countDocuments(),
      User.find().select('balance').lean(),
    ]);

    // Calculate total deposits
    let totalDeposits = BigInt(0);
    for (const user of users) {
      totalDeposits += BigInt(user.balance);
    }

    // Get recent transactions
    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({
      totalUsers,
      totalTransactions,
      totalDeposits: totalDeposits.toString(),
      recentTransactions,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


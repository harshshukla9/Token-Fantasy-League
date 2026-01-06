import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    // Get top users by balance
    const users = await User.find()
      .sort({ balance: -1 })
      .limit(limit)
      .select('address balance lastUpdated')
      .lean();

    // Convert balance strings to BigInt for proper sorting, then back to string
    const sortedUsers = users
      .map((user) => ({
        ...user,
        balanceBigInt: BigInt(user.balance),
      }))
      .sort((a, b) => (a.balanceBigInt > b.balanceBigInt ? -1 : 1))
      .map(({ balanceBigInt, ...user }) => user);

    return NextResponse.json({
      leaderboard: sortedUsers,
      total: await User.countDocuments(),
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


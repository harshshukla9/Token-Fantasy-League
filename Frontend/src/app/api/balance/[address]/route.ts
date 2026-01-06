import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    await connectDB();

    const { address } = params;

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid address format' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ address: address.toLowerCase() });

    if (!user) {
      return NextResponse.json({
        address: address.toLowerCase(),
        balance: '0',
        lastUpdated: null,
      });
    }

    return NextResponse.json({
      address: user.address,
      balance: user.balance,
      lastUpdated: user.lastUpdated,
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


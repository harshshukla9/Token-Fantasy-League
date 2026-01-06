import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { Transaction } from '@/lib/db/models/Transaction';

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    await connectDB();

    const { address } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid address format' },
        { status: 400 }
      );
    }

    const transactions = await Transaction.find({
      address: address.toLowerCase(),
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await Transaction.countDocuments({
      address: address.toLowerCase(),
    });

    console.log(`📋 Fetched ${transactions.length} transactions for ${address}`);

    return NextResponse.json({
      transactions,
      total,
      limit,
      skip,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


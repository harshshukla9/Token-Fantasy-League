import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';

/**
 * POST /api/withdraw/cancel
 * 
 * Cancel a withdrawal request and rollback the balance:
 * - Called when user cancels or transaction fails
 * - Restores the deducted balance
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { address, amount } = body;

    // Validate required fields
    if (!address || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: address and amount' },
        { status: 400 }
      );
    }

    // Validate amount
    const restoreAmount = BigInt(amount);
    if (restoreAmount <= 0n) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Find user and restore balance
    const user = await User.findOne({ address: address.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Restore the balance
    const currentBalance = BigInt(user.balance || '0');
    const newBalance = (currentBalance + restoreAmount).toString();
    
    user.balance = newBalance;
    user.lastUpdated = new Date();
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Balance restored successfully',
      newBalance,
    });
  } catch (error) {
    console.error('Withdraw cancel error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to cancel withdrawal', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}


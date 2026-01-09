import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { createPublicClient, http, keccak256, encodePacked, Hex, Address, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import OnchainWithdraw from '@/abis/OnchainWithdraw';

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

// Create public client for reading contract state
const publicClient = createPublicClient({
  chain: mantleSepolia,
  transport: http(process.env.RPC_URL || 'https://rpc.sepolia.mantle.xyz'),
});

/**
 * POST /api/withdraw/request
 * 
 * Request a withdrawal:
 * 1. Validate user has sufficient balance in DB
 * 2. Deduct balance from DB (optimistically)
 * 3. Get user's nonce from contract
 * 4. Generate server signature
 * 5. Return signature, nonce, amount for frontend to call contract
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

    // Validate amount is a valid number
    const withdrawAmount = BigInt(amount);
    if (withdrawAmount <= 0n) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Check if SERVER_PRIVATE_KEY is configured
    const serverPrivateKey = process.env.SERVER_PRIVATE_KEY;
    if (!serverPrivateKey) {
      console.error('SERVER_PRIVATE_KEY not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Find user and check balance
    const user = await User.findOne({ address: address.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const currentBalance = BigInt(user.balance || '0');
    if (currentBalance < withdrawAmount) {
      return NextResponse.json(
        { error: 'Insufficient balance', balance: user.balance },
        { status: 400 }
      );
    }

    // Get user's nonce from contract
    let nonce: bigint;
    try {
      nonce = await publicClient.readContract({
        address: OnchainWithdraw.address as Address,
        abi: OnchainWithdraw.abi,
        functionName: 'getUserNonce',
        args: [address as Address],
      }) as bigint;
    } catch (error) {
      console.error('Failed to get user nonce:', error);
      return NextResponse.json(
        { error: 'Failed to get user nonce from contract' },
        { status: 500 }
      );
    }

    // Generate server signature
    // Server signs: keccak256(user, amount, nonce, contractAddress)
    const messageHash = keccak256(
      encodePacked(
        ['address', 'uint256', 'uint256', 'address'],
        [
          address as Address,
          withdrawAmount,
          nonce,
          OnchainWithdraw.address as Address,
        ]
      )
    );

    // Sign the message with server private key
    const account = privateKeyToAccount(serverPrivateKey as Hex);
    const signature = await account.signMessage({
      message: { raw: messageHash },
    });

    // Deduct balance from DB optimistically
    const newBalance = (currentBalance - withdrawAmount).toString();
    user.balance = newBalance;
    user.lastUpdated = new Date();
    await user.save();

    return NextResponse.json({
      success: true,
      amount: withdrawAmount.toString(),
      nonce: nonce.toString(),
      signature,
      contractAddress: OnchainWithdraw.address,
      newBalance,
    });
  } catch (error) {
    console.error('Withdraw request error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process withdrawal request', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}


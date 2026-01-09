import mongoose, { Schema, Model, models } from 'mongoose';

export type TransactionType = 'deposit' | 'withdraw';

export interface ITransaction {
  address: string;
  amount: string; // Store as string to handle big numbers
  txHash: string;
  blockNumber: bigint;
  timestamp: Date;
  type: TransactionType;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  address: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
  },
  amount: {
    type: String,
    required: true,
  },
  txHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  blockNumber: {
    type: BigInt,
    required: false, // Not always available immediately
  },
  timestamp: {
    type: Date,
    required: true,
  },
  type: {
    type: String,
    enum: ['deposit', 'withdraw'],
    default: 'deposit',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'confirmed',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent model overwrite during hot reload
export const Transaction: Model<ITransaction> = models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);


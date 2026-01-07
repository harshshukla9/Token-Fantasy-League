import mongoose, { Schema, Model, models } from 'mongoose';

export interface ITransaction {
  address: string;
  amount: string; // Store as string to handle big numbers
  txHash: string;
  blockNumber: bigint;
  timestamp: Date;
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
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent model overwrite during hot reload
export const Transaction: Model<ITransaction> = models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);


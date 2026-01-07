import mongoose, { Schema, Model, models } from 'mongoose';

export interface ILobby {
  name: string;
  depositAmount: string; // Entry fee in wei (stored as string for big numbers)
  maxParticipants: number;
  numberOfCoins: number; // Number of cryptocurrencies (default 8)
  startTime: Date;
  interval: number; // Duration in seconds
  status: 'open' | 'full' | 'closed' | 'active' | 'ended';
  currentParticipants: number; // Calculated field
  totalFees: string; // Total fees collected in wei
  prizePool: string; // 90% of total fees in wei
  protocolFee: string; // 10% of total fees in wei
  createdBy: string; // Admin address
  createdAt: Date;
  updatedAt: Date;
}

const LobbySchema = new Schema<ILobby>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    depositAmount: {
      type: String,
      required: true,
      default: '0',
    },
    maxParticipants: {
      type: Number,
      required: true,
      min: 1,
    },
    numberOfCoins: {
      type: Number,
      required: true,
      default: 8,
      min: 1,
    },
    startTime: {
      type: Date,
      required: true,
    },
    interval: {
      type: Number,
      required: true,
      min: 0, // Duration in seconds
    },
    status: {
      type: String,
      enum: ['open', 'full', 'closed', 'active', 'ended'],
      default: 'open',
      index: true,
    },
    currentParticipants: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalFees: {
      type: String,
      default: '0',
    },
    prizePool: {
      type: String,
      default: '0',
    },
    protocolFee: {
      type: String,
      default: '0',
    },
    createdBy: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
LobbySchema.index({ status: 1, startTime: 1 });
LobbySchema.index({ createdAt: -1 });

// Prevent model overwrite during hot reload
export const Lobby: Model<ILobby> = models.Lobby || mongoose.model<ILobby>('Lobby', LobbySchema);


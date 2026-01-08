import mongoose, { Schema, Model, models } from 'mongoose';

export interface IPriceSnapshot {
  lobbyId: mongoose.Types.ObjectId;
  participantId: mongoose.Types.ObjectId;
  address: string;
  snapshotType: 'start' | 'end' | 'current';
  prices: {
    cryptoId: string;
    price: number;
    isCaptain: boolean;
    isViceCaptain: boolean;
  }[];
  timestamp: Date;
  createdAt: Date;
}

const PriceSnapshotSchema = new Schema<IPriceSnapshot>(
  {
    lobbyId: {
      type: Schema.Types.ObjectId,
      ref: 'Lobby',
      required: true,
      index: true,
    },
    participantId: {
      type: Schema.Types.ObjectId,
      ref: 'LobbyParticipant',
      required: true,
      index: true,
    },
    address: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    snapshotType: {
      type: String,
      enum: ['start', 'end', 'current'],
      required: true,
      index: true,
    },
    prices: [
      {
        cryptoId: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
          // Store as Decimal128 for better precision, but Number is fine for crypto prices (up to 8 decimals)
          // MongoDB Number type (Double) can handle up to 15-17 significant digits
        },
        isCaptain: {
          type: Boolean,
          default: false,
        },
        isViceCaptain: {
          type: Boolean,
          default: false,
        },
      },
    ],
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
PriceSnapshotSchema.index({ lobbyId: 1, participantId: 1, snapshotType: 1 }, { unique: true });

// Prevent model overwrite during hot reload
export const PriceSnapshot: Model<IPriceSnapshot> =
  models.PriceSnapshot || mongoose.model<IPriceSnapshot>('PriceSnapshot', PriceSnapshotSchema);


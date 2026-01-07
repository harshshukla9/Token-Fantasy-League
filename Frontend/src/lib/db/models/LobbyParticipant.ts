import mongoose, { Schema, Model, models } from 'mongoose';

export interface ILobbyParticipant {
  lobbyId: mongoose.Types.ObjectId;
  address: string; // Player wallet address
  team: {
    cryptos: string[]; // Array of crypto IDs/symbols
    captain: string | null; // Crypto ID for captain
    viceCaptain: string | null; // Crypto ID for vice-captain
  };
  entryFee: string; // Amount paid in wei
  points: number; // Fantasy points earned
  rank: number; // Current rank in lobby
  joinedAt: Date;
  createdAt: Date;
}

const LobbyParticipantSchema = new Schema<ILobbyParticipant>(
  {
    lobbyId: {
      type: Schema.Types.ObjectId,
      ref: 'Lobby',
      required: true,
      index: true,
    },
    address: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    team: {
      cryptos: {
        type: [String],
        required: true,
        validate: {
          validator: (v: string[]) => v.length > 0,
          message: 'Team must have at least one crypto',
        },
      },
      captain: {
        type: String,
        default: null,
      },
      viceCaptain: {
        type: String,
        default: null,
      },
    },
    entryFee: {
      type: String,
      required: true,
      default: '0',
    },
    points: {
      type: Number,
      default: 0,
    },
    rank: {
      type: Number,
      default: 0,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate entries
LobbyParticipantSchema.index({ lobbyId: 1, address: 1 }, { unique: true });

// Index for leaderboard queries
LobbyParticipantSchema.index({ lobbyId: 1, points: -1 });

// Prevent model overwrite during hot reload
export const LobbyParticipant: Model<ILobbyParticipant> =
  models.LobbyParticipant || mongoose.model<ILobbyParticipant>('LobbyParticipant', LobbyParticipantSchema);


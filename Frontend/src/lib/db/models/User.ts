import mongoose, { Schema, Model, models } from 'mongoose';

export interface IUser {
  address: string;
  balance: string; // Store as string to handle big numbers
  lastUpdated: Date;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  address: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true,
  },
  balance: {
    type: String,
    required: true,
    default: '0',
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent model overwrite during hot reload
export const User: Model<IUser> = models.User || mongoose.model<IUser>('User', UserSchema);


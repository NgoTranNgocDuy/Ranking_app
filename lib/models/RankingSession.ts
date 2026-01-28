import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRankingSession extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  slug: string;
  ownerId?: string; // Anonymous owner token for simple auth
  cardOrder: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const RankingSessionSchema = new Schema<IRankingSession>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    ownerId: {
      type: String,
      trim: true,
    },
    cardOrder: {
      type: [Schema.Types.ObjectId],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Create index on slug for fast lookups
RankingSessionSchema.index({ slug: 1 }, { unique: true });

export const RankingSession: Model<IRankingSession> =
  mongoose.models.RankingSession ||
  mongoose.model<IRankingSession>('RankingSession', RankingSessionSchema);

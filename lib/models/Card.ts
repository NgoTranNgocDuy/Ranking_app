import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICard extends Document {
  _id: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CardSchema = new Schema<ICard>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'RankingSession',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    linkUrl: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
CardSchema.index({ sessionId: 1, createdAt: -1 });

export const Card: Model<ICard> =
  mongoose.models.Card || mongoose.model<ICard>('Card', CardSchema);

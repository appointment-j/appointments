import mongoose, { Schema } from 'mongoose';

export interface ITutorial extends mongoose.Document {
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  videoUrl?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const tutorialSchema = new Schema<ITutorial>(
  {
    title_ar: { type: String, required: true },
    title_en: { type: String, required: true },
    description_ar: { type: String, required: true },
    description_en: { type: String, required: true },
    videoUrl: { type: String },
    order: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

tutorialSchema.index({ order: 1 });
tutorialSchema.index({ isActive: 1 });

export const Tutorial = mongoose.model<ITutorial>('Tutorial', tutorialSchema);


import { Schema, model, Document, Types } from "mongoose";

export interface IHabit extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const habitSchema = new Schema<IHabit>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

export const Habit = model<IHabit>("Habit", habitSchema);

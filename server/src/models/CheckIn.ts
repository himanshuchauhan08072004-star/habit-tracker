import { Schema, model, Document, Types } from "mongoose";

export interface ICheckIn extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  habitId: Types.ObjectId;
  /** The user's local calendar day this check-in counts for, e.g. "2026-08-24" */
  localDate: string;
  /** The actual UTC instant the check-in was recorded/backfilled at */
  checkedInAt: Date;
  createdAt: Date;
}

const checkInSchema = new Schema<ICheckIn>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    habitId: { type: Schema.Types.ObjectId, ref: "Habit", required: true, index: true },
    localDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    checkedInAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// THE core integrity guarantee: only one check-in per habit per local day,
// enforced by the database itself (not just application code), so
// concurrent/duplicate requests can never both succeed.
checkInSchema.index({ habitId: 1, localDate: 1 }, { unique: true });

export const CheckIn = model<ICheckIn>("CheckIn", checkInSchema);

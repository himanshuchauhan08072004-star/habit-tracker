import { Schema, model, Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never returned by default
    },
    timezone: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);

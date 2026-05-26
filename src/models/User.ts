import mongoose, { Schema, Model } from "mongoose";

export interface IUser {
  name: string;
  phone: string;
  role: "renter" | "owner" | "admin";
  license?: {
    frontUrl?: string;
    backUrl?: string;
    status: "none" | "pending" | "verified" | "rejected";
  };
  selfieUrl?: string;
  verified: boolean;
  createdAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: ["renter", "owner", "admin"],
      default: "renter",
    },
    license: {
      frontUrl: { type: String },
      backUrl: { type: String },
      status: {
        type: String,
        enum: ["none", "pending", "verified", "rejected"],
        default: "none",
      },
    },
    selfieUrl: { type: String },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;

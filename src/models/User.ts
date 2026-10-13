import { Schema, deleteModel, model, models, type Model } from "mongoose";

export interface UserDoc {
  name: string;
  /** Lowercased; the login identifier */
  email: string;
  /** "scrypt$<salt>$<hash>", see lib/password */
  passwordHash: string;
  loginFails: number;
  lockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    loginFails: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
  },
  { timestamps: true },
);

// Recompile rather than reuse a cached model: after a hot reload the cached one still has
// the old schema and silently drops fields added since
if (models.User) deleteModel("User");
export const UserModel: Model<UserDoc> = model<UserDoc>("User", userSchema);

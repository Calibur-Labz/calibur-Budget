import { Schema, deleteModel, model, models, type Model } from "mongoose";
import type { Category } from "@/lib/categories";

export interface SettingsDoc {
  /** The owner's user id: one settings document per account */
  key: string;
  /** Money for the whole budget month, from salary */
  mainBudget: number;
  /** Spending target for each day, set independently of mainBudget */
  dailyBudget: number;
  /** Day of the month (1–28) a budget month starts on */
  monthStartDay: number;
  currency: string;
  categories: Category[];
}

const settingsSchema = new Schema<SettingsDoc>({
  key: { type: String, required: true, unique: true },
  mainBudget: { type: Number, default: 0, min: 0 },
  dailyBudget: { type: Number, default: 0, min: 0 },
  monthStartDay: { type: Number, default: 1, min: 1, max: 28 },
  currency: { type: String, default: "LKR" },
  categories: [
    {
      _id: false,
      name: { type: String, required: true },
      icon: { type: String, required: true },
      slot: { type: Number, required: true, min: 1, max: 8 },
    },
  ],
});

// Recompile rather than reuse a cached model: after a hot reload the cached one still has
// the old schema and silently drops fields added since
if (models.Settings) deleteModel("Settings");
export const SettingsModel: Model<SettingsDoc> = model<SettingsDoc>("Settings", settingsSchema);

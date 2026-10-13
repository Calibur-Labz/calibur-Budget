import { Schema, deleteModel, model, models, type Model } from "mongoose";
import { DATE_RE } from "@/lib/dates";

export interface IncomeDoc {
  /** Owner's user id */
  userId: string;
  amount: number;
  /** Where the money came from, e.g. "Salary" */
  note: string;
  /** Local calendar day, "YYYY-MM-DD" */
  date: string;
  createdAt: Date;
  updatedAt: Date;
}

const incomeSchema = new Schema<IncomeDoc>(
  {
    userId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    note: { type: String, default: "", trim: true },
    date: { type: String, required: true, match: DATE_RE, index: true },
  },
  { timestamps: true },
);
// Every list is one user's incomes in a date range, newest first
incomeSchema.index({ userId: 1, date: -1, createdAt: -1 });

// Recompile rather than reuse a cached model: after a hot reload the cached one still has
// the old schema and silently drops fields added since
if (models.Income) deleteModel("Income");
export const IncomeModel: Model<IncomeDoc> = model<IncomeDoc>("Income", incomeSchema);

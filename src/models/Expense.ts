import { Schema, deleteModel, model, models, type Model } from "mongoose";
import { DATE_RE } from "@/lib/dates";

export interface ExpenseDoc {
  amount: number;
  category: string;
  note: string;
  /** Local calendar day, "YYYY-MM-DD" */
  date: string;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<ExpenseDoc>(
  {
    amount: { type: Number, required: true, min: 0.01 },
    category: { type: String, required: true, trim: true },
    note: { type: String, default: "", trim: true },
    date: { type: String, required: true, match: DATE_RE, index: true },
  },
  { timestamps: true },
);

// Recompile rather than reuse a cached model: after a hot reload the cached one still has
// the old schema and silently drops fields added since
if (models.Expense) deleteModel("Expense");
export const ExpenseModel: Model<ExpenseDoc> = model<ExpenseDoc>("Expense", expenseSchema);

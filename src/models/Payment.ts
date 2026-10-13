import { Schema, deleteModel, model, models, type Model } from "mongoose";
import { DATE_RE } from "@/lib/dates";

export interface PaymentDoc {
  /** Owner's user id */
  userId: string;
  name: string;
  amount: number;
  category: string;
  /** Local calendar day, "YYYY-MM-DD" */
  dueDate: string;
  repeat: "none" | "monthly";
  /** Day of month a monthly payment was set up on, so short months don't shift it for good */
  anchorDay: number;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<PaymentDoc>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    category: { type: String, required: true, trim: true },
    dueDate: { type: String, required: true, match: DATE_RE, index: true },
    repeat: { type: String, enum: ["none", "monthly"], default: "none" },
    anchorDay: { type: Number, required: true, min: 1, max: 31 },
  },
  { timestamps: true },
);

// Recompile rather than reuse a cached model: after a hot reload the cached one still has
// the old schema and silently drops fields added since
if (models.Payment) deleteModel("Payment");
export const PaymentModel: Model<PaymentDoc> = model<PaymentDoc>("Payment", paymentSchema);

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { round2 } from "@/lib/budget";
import { connectDB } from "@/lib/db";
import { dayOf, isRealDate, nextMonthlyDate } from "@/lib/dates";
import { getSettings, getToday } from "@/lib/queries";
import { ExpenseModel } from "@/models/Expense";
import { PaymentModel } from "@/models/Payment";
import type { ActionResult } from "./expenses";

const objectId = z.string().regex(/^[a-f0-9]{24}$/);

const paymentSchema = z.object({
  name: z.string().trim().min(1).max(40),
  amount: z.number().positive().max(1_000_000_000),
  category: z.string().trim().min(1).max(30),
  dueDate: z.string().refine(isRealDate),
  repeat: z.enum(["none", "monthly"]),
});

export type PaymentInput = z.input<typeof paymentSchema>;

export async function addPayment(input: PaymentInput): Promise<ActionResult> {
  await requireSession();
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the name, amount and due date." };
  const data = { ...parsed.data, amount: round2(parsed.data.amount) };
  if (data.amount <= 0) return { ok: false, error: "Enter an amount." };

  const { categories } = await getSettings();
  if (!categories.some((c) => c.name === data.category)) {
    return { ok: false, error: "Pick a category." };
  }

  await connectDB();
  await PaymentModel.create({ ...data, anchorDay: dayOf(data.dueDate) });
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Records the payment as an expense dated today, then rolls a monthly one forward or removes a one-off. */
export async function payPayment(id: string): Promise<ActionResult> {
  await requireSession();
  if (!objectId.safeParse(id).success) return { ok: false, error: "Invalid payment." };
  await connectDB();
  const payment = await PaymentModel.findById(id);
  if (!payment) return { ok: false, error: "That payment no longer exists." };

  await ExpenseModel.create({
    amount: payment.amount,
    category: payment.category,
    note: payment.name,
    date: await getToday(),
  });
  if (payment.repeat === "monthly") {
    payment.dueDate = nextMonthlyDate(payment.dueDate, payment.anchorDay);
    await payment.save();
  } else {
    await payment.deleteOne();
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deletePayment(id: string): Promise<ActionResult> {
  await requireSession();
  if (!objectId.safeParse(id).success) return { ok: false, error: "Invalid payment." };
  await connectDB();
  await PaymentModel.findByIdAndDelete(id);
  revalidatePath("/", "layout");
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { round2 } from "@/lib/budget";
import { connectDB } from "@/lib/db";
import { isRealDate } from "@/lib/dates";
import { getSettings } from "@/lib/queries";
import { ExpenseModel } from "@/models/Expense";

export type ActionResult = { ok: true } | { ok: false; error: string };

const objectId = z.string().regex(/^[a-f0-9]{24}$/);

const expenseSchema = z.object({
  id: objectId.optional(),
  amount: z.number().positive().max(1_000_000_000),
  category: z.string().trim().min(1).max(30),
  note: z.string().trim().max(120).default(""),
  date: z.string().refine(isRealDate),
});

export type ExpenseInput = z.input<typeof expenseSchema>;

export async function saveExpense(input: ExpenseInput): Promise<ActionResult> {
  await requireSession();
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the amount, category and date." };
  const { id, ...data } = parsed.data;
  data.amount = round2(data.amount);
  if (data.amount <= 0) return { ok: false, error: "Enter an amount." };

  const { categories } = await getSettings();
  if (!categories.some((c) => c.name === data.category)) {
    return { ok: false, error: "Pick a category." };
  }

  await connectDB();
  if (id) {
    const updated = await ExpenseModel.findByIdAndUpdate(id, data, { runValidators: true });
    if (!updated) return { ok: false, error: "That expense no longer exists." };
  } else {
    await ExpenseModel.create(data);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  await requireSession();
  if (!objectId.safeParse(id).success) return { ok: false, error: "Invalid expense." };
  await connectDB();
  await ExpenseModel.findByIdAndDelete(id);
  revalidatePath("/", "layout");
  return { ok: true };
}

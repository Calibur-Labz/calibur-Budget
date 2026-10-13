"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { round2 } from "@/lib/budget";
import { connectDB } from "@/lib/db";
import { isRealDate } from "@/lib/dates";
import { IncomeModel } from "@/models/Income";
import type { ActionResult } from "./expenses";

const objectId = z.string().regex(/^[a-f0-9]{24}$/);

const incomeSchema = z.object({
  id: objectId.optional(),
  amount: z.number().positive().max(1_000_000_000),
  note: z.string().trim().max(120).default(""),
  date: z.string().refine(isRealDate),
});

export type IncomeInput = z.input<typeof incomeSchema>;

export async function saveIncome(input: IncomeInput): Promise<ActionResult> {
  const userId = await requireSession();
  const parsed = incomeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the amount and date." };
  const { id, ...data } = parsed.data;
  data.amount = round2(data.amount);
  if (data.amount <= 0) return { ok: false, error: "Enter an amount." };

  await connectDB();
  if (id) {
    const updated = await IncomeModel.findOneAndUpdate({ _id: id, userId }, data, {
      runValidators: true,
    });
    if (!updated) return { ok: false, error: "That income no longer exists." };
  } else {
    await IncomeModel.create({ ...data, userId });
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteIncome(id: string): Promise<ActionResult> {
  const userId = await requireSession();
  if (!objectId.safeParse(id).success) return { ok: false, error: "Invalid income." };
  await connectDB();
  await IncomeModel.deleteOne({ _id: id, userId });
  revalidatePath("/", "layout");
  return { ok: true };
}

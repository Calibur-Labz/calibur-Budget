"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { round2 } from "@/lib/budget";
import { CURRENCIES, ICON_NAMES, MAX_CATEGORIES } from "@/lib/categories";
import { MAX_START_DAY } from "@/lib/dates";
import { connectDB } from "@/lib/db";
import { SETTINGS_KEY, getSettings } from "@/lib/queries";
import { SettingsModel } from "@/models/Settings";
import type { ActionResult } from "./expenses";

const budgetSchema = z.object({
  mainBudget: z.number().min(0).max(1_000_000_000),
  dailyBudget: z.number().min(0).max(1_000_000_000),
  monthStartDay: z.number().int().min(1).max(MAX_START_DAY),
  currency: z.enum(CURRENCIES),
});

export async function saveBudget(input: z.input<typeof budgetSchema>): Promise<ActionResult> {
  await requireSession();
  const parsed = budgetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter valid amounts." };
  await getSettings();
  await SettingsModel.updateOne(
    { key: SETTINGS_KEY },
    {
      mainBudget: round2(parsed.data.mainBudget),
      dailyBudget: round2(parsed.data.dailyBudget),
      monthStartDay: parsed.data.monthStartDay,
      currency: parsed.data.currency,
    },
  );
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function saveCurrency(currency: string): Promise<ActionResult> {
  await requireSession();
  const parsed = z.enum(CURRENCIES).safeParse(currency);
  if (!parsed.success) return { ok: false, error: "Pick a currency from the list." };
  await getSettings();
  await SettingsModel.updateOne({ key: SETTINGS_KEY }, { currency: parsed.data });
  revalidatePath("/", "layout");
  return { ok: true };
}

const categorySchema = z.object({
  name: z.string().trim().min(1).max(20),
  icon: z.enum(ICON_NAMES),
  slot: z.number().int().min(1).max(8),
});

export async function addCategory(input: z.input<typeof categorySchema>): Promise<ActionResult> {
  await requireSession();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Give the category a name (up to 20 characters)." };
  const { categories } = await getSettings();
  if (categories.length >= MAX_CATEGORIES) {
    return { ok: false, error: `You can have up to ${MAX_CATEGORIES} categories.` };
  }
  const name = parsed.data.name;
  if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
    return { ok: false, error: "That category already exists." };
  }
  await SettingsModel.updateOne({ key: SETTINGS_KEY }, { $push: { categories: parsed.data } });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeCategory(name: string): Promise<ActionResult> {
  await requireSession();
  const { categories } = await getSettings();
  if (!categories.some((c) => c.name === name)) return { ok: true };
  if (categories.length <= 1) return { ok: false, error: "Keep at least one category." };
  await connectDB();
  await SettingsModel.updateOne({ key: SETTINGS_KEY }, { $pull: { categories: { name } } });
  revalidatePath("/", "layout");
  return { ok: true };
}

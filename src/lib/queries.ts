import { cache } from "react";
import { cookies } from "next/headers";
import { requireSession } from "./auth";
import { connectDB } from "./db";
import { DEFAULT_CATEGORIES, type Category } from "./categories";
import { todayInTz } from "./dates";
import { ExpenseModel } from "@/models/Expense";
import { PaymentModel } from "@/models/Payment";
import { SettingsModel } from "@/models/Settings";
import { UserModel } from "@/models/User";

export const TZ_COOKIE = "tz";

export interface Expense {
  id: string;
  amount: number;
  category: string;
  note: string;
  date: string;
}

export interface Payment {
  id: string;
  name: string;
  amount: number;
  category: string;
  dueDate: string;
  repeat: "none" | "monthly";
}

export interface Settings {
  mainBudget: number;
  dailyBudget: number;
  monthStartDay: number;
  currency: string;
  categories: Category[];
}

/** Today's date where the viewer is; the browser reports its timezone in a cookie. */
export async function getToday(): Promise<string> {
  const tz = (await cookies()).get(TZ_COOKIE)?.value;
  return todayInTz(tz ? decodeURIComponent(tz) : "UTC");
}

/**
 * The signed-in user's settings, created with the default categories on first use.
 * Cached for the length of one request, so a page that asks twice reads once.
 */
export const getSettings = cache(async (): Promise<Settings> => {
  const userId = await requireSession();
  await connectDB();
  // A plain read on every load; the upsert (a write) only runs the first time
  const doc =
    (await SettingsModel.findOne({ key: userId }).lean()) ??
    (await SettingsModel.findOneAndUpdate(
      { key: userId },
      { $setOnInsert: { categories: DEFAULT_CATEGORIES } },
      { upsert: true, returnDocument: "after" },
    ).lean());
  return {
    mainBudget: doc.mainBudget ?? 0,
    dailyBudget: doc.dailyBudget ?? 0,
    monthStartDay: doc.monthStartDay ?? 1,
    currency: doc.currency ?? "LKR",
    categories: (doc.categories ?? []).map((c) => ({ name: c.name, icon: c.icon, slot: c.slot })),
  };
});

/** Expenses from `start` to `end` inclusive, newest first. */
export async function getExpensesBetween(start: string, end: string): Promise<Expense[]> {
  const userId = await requireSession();
  await connectDB();
  const docs = await ExpenseModel.find({ userId, date: { $gte: start, $lte: end } })
    .sort({ date: -1, createdAt: -1 })
    .lean();
  return docs.map((d) => ({
    id: String(d._id),
    amount: d.amount,
    category: d.category,
    note: d.note ?? "",
    date: d.date,
  }));
}

export async function getExpense(id: string): Promise<Expense | null> {
  if (!/^[a-f0-9]{24}$/.test(id)) return null;
  const userId = await requireSession();
  await connectDB();
  const d = await ExpenseModel.findOne({ _id: id, userId }).lean();
  if (!d) return null;
  return { id: String(d._id), amount: d.amount, category: d.category, note: d.note ?? "", date: d.date };
}

/** Every unpaid payment, soonest first. */
export async function getPayments(): Promise<Payment[]> {
  const userId = await requireSession();
  await connectDB();
  const docs = await PaymentModel.find({ userId }).sort({ dueDate: 1, createdAt: 1 }).lean();
  return docs.map((d) => ({
    id: String(d._id),
    name: d.name,
    amount: d.amount,
    category: d.category,
    dueDate: d.dueDate,
    repeat: d.repeat,
  }));
}

export async function getUser(): Promise<{ name: string; email: string } | null> {
  const userId = await requireSession();
  await connectDB();
  const user = await UserModel.findById(userId).lean();
  return user ? { name: user.name, email: user.email } : null;
}

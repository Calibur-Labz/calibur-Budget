import { cookies } from "next/headers";
import { connectDB } from "./db";
import { DEFAULT_CATEGORIES, type Category } from "./categories";
import { todayInTz } from "./dates";
import { ExpenseModel } from "@/models/Expense";
import { PaymentModel } from "@/models/Payment";
import { SettingsModel } from "@/models/Settings";

export const SETTINGS_KEY = "main";
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

export async function getSettings(): Promise<Settings> {
  await connectDB();
  const doc = await SettingsModel.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { $setOnInsert: { categories: DEFAULT_CATEGORIES } },
    { upsert: true, returnDocument: "after" },
  ).lean();
  return {
    mainBudget: doc.mainBudget ?? 0,
    dailyBudget: doc.dailyBudget ?? 0,
    monthStartDay: doc.monthStartDay ?? 1,
    currency: doc.currency ?? "LKR",
    categories: (doc.categories ?? []).map((c) => ({ name: c.name, icon: c.icon, slot: c.slot })),
  };
}

/** Expenses from `start` to `end` inclusive, newest first. */
export async function getExpensesBetween(start: string, end: string): Promise<Expense[]> {
  await connectDB();
  const docs = await ExpenseModel.find({ date: { $gte: start, $lte: end } })
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
  await connectDB();
  const d = await ExpenseModel.findById(id).lean();
  if (!d) return null;
  return { id: String(d._id), amount: d.amount, category: d.category, note: d.note ?? "", date: d.date };
}

/** Every unpaid payment, soonest first. */
export async function getPayments(): Promise<Payment[]> {
  await connectDB();
  const docs = await PaymentModel.find().sort({ dueDate: 1, createdAt: 1 }).lean();
  return docs.map((d) => ({
    id: String(d._id),
    name: d.name,
    amount: d.amount,
    category: d.category,
    dueDate: d.dueDate,
    repeat: d.repeat,
  }));
}

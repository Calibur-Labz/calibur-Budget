"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { connectDB } from "@/lib/db";
import { SETTINGS_KEY } from "@/lib/queries";
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken, isAuthConfigured } from "@/lib/session";
import { SettingsModel } from "@/models/Settings";

const MAX_FAILS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;

function samePin(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function unlock(pin: string): Promise<{ error: string }> {
  if (!isAuthConfigured()) {
    return { error: "Set APP_PIN and SESSION_SECRET in .env.local, then restart." };
  }
  if (typeof pin !== "string" || pin.length === 0 || pin.length > 32) {
    return { error: "Enter your PIN." };
  }

  // Failed attempts are counted in the database so the lockout holds across
  // serverless instances and restarts.
  let state;
  try {
    await connectDB();
    state = await SettingsModel.findOneAndUpdate(
      { key: SETTINGS_KEY },
      { $setOnInsert: { categories: DEFAULT_CATEGORIES } },
      { upsert: true, returnDocument: "after" },
    ).lean();
  } catch {
    return { error: "Can't reach the database. Check MONGODB_URI." };
  }

  const lockedUntil = state.pinLockedUntil ? new Date(state.pinLockedUntil).getTime() : 0;
  if (lockedUntil > Date.now()) {
    const mins = Math.ceil((lockedUntil - Date.now()) / 60000);
    return { error: `Too many attempts. Try again in ${mins} min.` };
  }

  if (!samePin(pin, process.env.APP_PIN!)) {
    const after = await SettingsModel.findOneAndUpdate(
      { key: SETTINGS_KEY },
      { $inc: { pinFails: 1 } },
      { returnDocument: "after" },
    ).lean();
    if ((after?.pinFails ?? 0) >= MAX_FAILS) {
      await SettingsModel.updateOne(
        { key: SETTINGS_KEY },
        { pinFails: 0, pinLockedUntil: new Date(Date.now() + LOCKOUT_MS) },
      );
      return { error: "Too many attempts. Try again in 5 min." };
    }
    return { error: "Wrong PIN." };
  }

  await SettingsModel.updateOne({ key: SETTINGS_KEY }, { pinFails: 0, pinLockedUntil: null });
  (await cookies()).set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect("/");
}

export async function lock(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/unlock");
}

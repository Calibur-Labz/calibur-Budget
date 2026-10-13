"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken, isAuthConfigured } from "@/lib/session";
import { ExpenseModel } from "@/models/Expense";
import { PaymentModel } from "@/models/Payment";
import { SettingsModel } from "@/models/Settings";
import { UserModel } from "@/models/User";

const MAX_FAILS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;
const MIN_PASSWORD = 8;
/** Settings key the app used before it had accounts */
const LEGACY_SETTINGS_KEY = "main";

const NOT_CONFIGURED = "Set SESSION_SECRET in .env.local, then restart.";
const NO_DATABASE = "Can't reach the database. Check MONGODB_URI.";

const email = z.string().trim().toLowerCase().pipe(z.email().max(254));
const registerSchema = z.object({
  name: z.string().trim().min(1).max(60),
  email,
  password: z.string().min(MIN_PASSWORD).max(200),
});
const loginSchema = z.object({ email, password: z.string().min(1).max(200) });

async function startSession(userId: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, await createSessionToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/** On success the action redirects and never returns. */
export async function register(input: z.input<typeof registerSchema>): Promise<{ error: string }> {
  if (!isAuthConfigured()) return { error: NOT_CONFIGURED };
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: `Enter your name, a valid email and a password of at least ${MIN_PASSWORD} characters.` };
  }
  const { name, email, password } = parsed.data;

  let userId: string;
  try {
    await connectDB();
    if (await UserModel.exists({ email })) {
      return { error: "An account with that email already exists. Log in instead." };
    }
    const user = await UserModel.create({ name, email, passwordHash: await hashPassword(password) });
    userId = String(user._id);

    // Data from before the app had accounts goes to whoever registers first.
    // Renaming the settings key is atomic, so only one account can claim it.
    const claimed = await SettingsModel.updateOne({ key: LEGACY_SETTINGS_KEY }, { key: userId });
    if (claimed.modifiedCount > 0) {
      await ExpenseModel.updateMany({ userId: { $exists: false } }, { userId });
      await PaymentModel.updateMany({ userId: { $exists: false } }, { userId });
    }
  } catch (err) {
    // Two sign-ups with the same email at once: the unique index stops the second
    if ((err as { code?: number }).code === 11000) {
      return { error: "An account with that email already exists. Log in instead." };
    }
    return { error: NO_DATABASE };
  }

  await startSession(userId);
  redirect("/");
}

/** On success the action redirects and never returns. */
export async function login(input: z.input<typeof loginSchema>): Promise<{ error: string }> {
  if (!isAuthConfigured()) return { error: NOT_CONFIGURED };
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { error: "Enter your email and password." };
  const { email, password } = parsed.data;
  const wrong = { error: "Wrong email or password." };

  let userId: string;
  try {
    await connectDB();
    const user = await UserModel.findOne({ email });
    if (!user) return wrong;

    // Failed attempts are counted in the database so the lockout holds across
    // serverless instances and restarts.
    const lockedUntil = user.lockedUntil?.getTime() ?? 0;
    if (lockedUntil > Date.now()) {
      const mins = Math.ceil((lockedUntil - Date.now()) / 60000);
      return { error: `Too many attempts. Try again in ${mins} min.` };
    }

    if (!(await verifyPassword(password, user.passwordHash))) {
      const after = await UserModel.findByIdAndUpdate(
        user._id,
        { $inc: { loginFails: 1 } },
        { returnDocument: "after" },
      );
      if ((after?.loginFails ?? 0) >= MAX_FAILS) {
        await UserModel.updateOne(
          { _id: user._id },
          { loginFails: 0, lockedUntil: new Date(Date.now() + LOCKOUT_MS) },
        );
        return { error: "Too many attempts. Try again in 5 min." };
      }
      return wrong;
    }

    await UserModel.updateOne({ _id: user._id }, { loginFails: 0, lockedUntil: null });
    userId = String(user._id);
  } catch {
    return { error: NO_DATABASE };
  }

  await startSession(userId);
  redirect("/");
}

export async function logout(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

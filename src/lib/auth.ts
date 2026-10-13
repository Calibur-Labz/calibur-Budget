import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "./session";

/**
 * The signed-in user's id. Server actions and queries call this themselves and scope
 * everything they touch to it; middleware alone is not the only gate.
 */
export async function requireSession(): Promise<string> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const userId = await verifySessionToken(token);
  if (!userId) throw new Error("Not signed in");
  return userId;
}

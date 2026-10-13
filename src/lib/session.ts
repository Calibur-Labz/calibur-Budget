// Subpath imports keep jose's Node-only JWE code out of the middleware bundle
import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";

// Edge-safe: imported by middleware, so no next/headers or node:crypto here.

export const SESSION_COOKIE = "budget_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function secretKey(): Uint8Array | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) return null;
  return new TextEncoder().encode(secret);
}

export function isAuthConfigured(): boolean {
  return Boolean(process.env.APP_PIN) && secretKey() !== null;
}

export async function createSessionToken(): Promise<string> {
  const key = secretKey();
  if (!key) throw new Error("SESSION_SECRET must be set to at least 16 characters.");
  return new SignJWT({ sub: "owner" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(key);
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  const key = secretKey();
  if (!key || !token) return false;
  try {
    await jwtVerify(token, key, { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

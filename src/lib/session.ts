// Subpath imports keep jose's Node-only JWE code out of the middleware bundle
import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";

// Edge-safe: imported by middleware, so no next/headers or node:crypto here.

export const SESSION_COOKIE = "budget_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

const USER_ID_RE = /^[a-f0-9]{24}$/;

function secretKey(): Uint8Array | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) return null;
  return new TextEncoder().encode(secret);
}

export function isAuthConfigured(): boolean {
  return secretKey() !== null;
}

export async function createSessionToken(userId: string): Promise<string> {
  const key = secretKey();
  if (!key) throw new Error("SESSION_SECRET must be set to at least 16 characters.");
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(key);
}

/** The signed-in user's id, or null when the token is missing, expired or forged. */
export async function verifySessionToken(token: string | undefined): Promise<string | null> {
  const key = secretKey();
  if (!key || !token) return null;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return payload.sub && USER_ID_RE.test(payload.sub) ? payload.sub : null;
  } catch {
    return null;
  }
}

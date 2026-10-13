import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

// "/unlock" was the PIN screen; old bookmarks land on the right side of the gate
const SIGNED_OUT_ONLY = ["/login", "/register", "/unlock"];

export async function middleware(req: NextRequest) {
  const authed = (await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) !== null;
  const { pathname } = req.nextUrl;
  const signedOutPage = SIGNED_OUT_ONLY.includes(pathname);

  if (authed && signedOutPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (!authed && (!signedOutPage || pathname === "/unlock")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  // Everything except Next internals and the PWA manifest/icons
  matcher: ["/((?!_next/static|_next/image|manifest.webmanifest|icons/|icon|apple-icon).*)"],
};

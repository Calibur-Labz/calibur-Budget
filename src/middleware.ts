import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const authed = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  const onUnlock = req.nextUrl.pathname === "/unlock";

  if (!authed && !onUnlock) {
    return NextResponse.redirect(new URL("/unlock", req.url));
  }
  if (authed && onUnlock) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = {
  // Everything except Next internals and the PWA manifest/icons
  matcher: ["/((?!_next/static|_next/image|manifest.webmanifest|icons/|icon|apple-icon).*)"],
};

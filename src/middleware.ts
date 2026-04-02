import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ── Auth public routes ────────────────────────────────────────────────────────
const AUTH_PUBLIC = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
  "/shop",
  "/cart",
  "/access",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Toujours laisser passer les assets statiques
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  // ── Auth gate ─────────────────────────────────────────────────────────────
  if (AUTH_PUBLIC.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

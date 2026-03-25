import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ── Preview access gate ──────────────────────────────────────────────────────
const PREVIEW_COOKIE = "pm_dev_access";
const PREVIEW_CODE = "pixelmart123@_";

// Routes accessibles SANS code preview (marketing public + gate elle-même)
const PREVIEW_PUBLIC = ["/access", "/landing", "/api/access"];

// ── Auth public routes (inchangé) ─────────────────────────────────────────────
const AUTH_PUBLIC = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
  "/shop",
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

  // ── 1. Preview gate ─────────────────────────────────────────────────────────
  const isPreviewPublic = PREVIEW_PUBLIC.some((p) => pathname.startsWith(p));

  if (!isPreviewPublic) {
    const previewCookie = request.cookies.get(PREVIEW_COOKIE)?.value;
    if (previewCookie !== PREVIEW_CODE) {
      const url = new URL("/access", request.url);
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  // ── 2. Auth gate (comportement inchangé) ─────────────────────────────────
  if (AUTH_PUBLIC.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

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

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ── Lancement : 1er avril 2026 à 16h00 heure de Cotonou (UTC+1)
const LAUNCH_AT = new Date("2026-04-01T15:00:00.000Z").getTime();

// Routes accessibles avant le lancement (page countdown + auth)
const PRELAUNCH_PUBLIC = ["/access", "/api/auth", "/landing"];

// ── Auth public routes ────────────────────────────────────────────────────────
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

  // ── 1. Launch gate ───────────────────────────────────────────────────────────
  const isLaunched = Date.now() >= LAUNCH_AT;
  const isPrelaunchPublic = PRELAUNCH_PUBLIC.some((p) => pathname.startsWith(p));

  if (!isLaunched && !isPrelaunchPublic) {
    return NextResponse.redirect(new URL("/access", request.url));
  }

  // Après le lancement, /access redirige vers l'accueil
  if (isLaunched && pathname.startsWith("/access")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // ── 2. Auth gate ─────────────────────────────────────────────────────────────
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

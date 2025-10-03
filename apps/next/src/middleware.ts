import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "./lib/constants";

const PUBLIC_ROUTES = ["/", "/contact", "/login"];
const AUTH_ROUTE = "/login";
const APP_HOME = "/app";

export function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname.startsWith(AUTH_ROUTE);
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const isProtectedRoute = pathname.startsWith(APP_HOME);

  if (!token && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = AUTH_ROUTE;
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (token && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = APP_HOME;
    return NextResponse.redirect(url);
  }

  if (!token && !isPublicRoute && pathname !== AUTH_ROUTE && !isProtectedRoute) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};

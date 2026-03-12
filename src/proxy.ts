import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === "/api/auth/error") {
    const url = new URL("/auth/error", request.url);
    const error = searchParams.get("error");
    if (error) {
      url.searchParams.set("error", error);
    }
    return NextResponse.redirect(url);
  }

  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/auth/error",
    "/((?!sign-in|auth/error|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};

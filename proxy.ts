import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifyToken } from "./app/_lib/session-token";

const authPages = ["/login", "/signup"];

// Optimistic check only (signature + expiry, no DB). Pages and route handlers
// still verify the user via app/_lib/auth.ts.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loggedIn = verifyToken(request.cookies.get(SESSION_COOKIE)?.value) !== null;
  const isAuthPage = authPages.includes(pathname);

  // Only gate unauthenticated access here. Deciding whether a valid-looking
  // token maps to a real user requires the database, which the proxy doesn't
  // have. Redirecting "logged in" users away from /login here would loop
  // forever if the token outlives its user row (e.g. the account was deleted),
  // because the server pages redirect the other way. The /login and /signup
  // pages do that DB-backed check themselves via getSessionUser().
  if (!loggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

import { NextResponse, type NextRequest } from "next/server";

const publicPaths = new Set(["/login", "/signup"]);

export function proxy(request: NextRequest) {
  const cookieName = process.env.NODE_ENV === "production" ? "__Host-astu_session" : "astu_session";
  const hasSession = Boolean(request.cookies.get(cookieName)?.value);
  if (!hasSession && !publicPaths.has(request.nextUrl.pathname) && !request.nextUrl.pathname.startsWith("/invitations/")) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }
  if (hasSession && publicPaths.has(request.nextUrl.pathname)) return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"] };

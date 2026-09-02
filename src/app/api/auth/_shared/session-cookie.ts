import { cookies } from "next/headers";

const production = process.env.NODE_ENV === "production";
export const SESSION_COOKIE_NAME = production ? "__Host-astu_session" : "astu_session";

export async function readSessionToken(): Promise<string> {
  return (await cookies()).get(SESSION_COOKIE_NAME)?.value ?? "";
}

export async function writeSessionCookie(token: string, expiresAt: Date): Promise<void> {
  (await cookies()).set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: production,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: production,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

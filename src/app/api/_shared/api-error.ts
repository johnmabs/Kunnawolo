import { NextResponse } from "next/server";

export function apiErrorResponse(error: unknown, fallbackCode: string): NextResponse {
  const code = error instanceof Error && "code" in error ? String(error.code) : fallbackCode;
  if (code.startsWith("security.")) return NextResponse.json({ code }, { status: 401 });
  if (code.endsWith("_not_found") || code.includes(".cart_not_found")) return NextResponse.json({ code }, { status: 404 });
  if (code.endsWith("_taken") || code.endsWith("_conflict")) return NextResponse.json({ code }, { status: 409 });
  return NextResponse.json({ code }, { status: 400 });
}

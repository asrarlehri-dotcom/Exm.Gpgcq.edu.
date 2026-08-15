import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const error = searchParams.get("error") || "AuthError";
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("error", error);
  return NextResponse.redirect(loginUrl);
}

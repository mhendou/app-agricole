import { NextResponse } from "next/server";
import { COOKIE_SESSION } from "@/lib/auth/session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_SESSION, "", { path: "/", maxAge: 0 });
  return res;
}

import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { buildGoogleAuthUrl } from "@/lib/google-auth";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/google/callback`;

  const state = randomBytes(16).toString("hex");
  const store = await cookies();
  store.set("google_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  try {
    const url = buildGoogleAuthUrl(redirectUri, state);
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.redirect(`${origin}/ingresar?error=google`);
  }
}

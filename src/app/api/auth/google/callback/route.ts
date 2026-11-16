import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { findOrCreateGoogleUser } from "@/lib/google-auth";
import { createSession, setSessionCookie } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const redirectUri = `${origin}/api/auth/google/callback`;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const store = await cookies();
  const stateCookie = store.get("google_oauth_state")?.value;

  if (error || !code || !state || state !== stateCookie) {
    return NextResponse.redirect(`${origin}/ingresar?error=google`);
  }

  try {
    const user = await findOrCreateGoogleUser(code, redirectUri);
    const token = await createSession(user.id);
    await setSessionCookie(token);
    return NextResponse.redirect(`${origin}/cuenta`);
  } catch {
    return NextResponse.redirect(`${origin}/ingresar?error=google`);
  }
}

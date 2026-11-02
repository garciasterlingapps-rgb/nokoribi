import { cache } from "react";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { randomBytes, randomUUID } from "node:crypto";
import { queryOne, execute } from "@/lib/db";
import type { SafeUser, User } from "@/lib/types";

const SESSION_COOKIE = "nokoribi_session";
const SESSION_DAYS = 30;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
  await execute(
    "INSERT INTO sessions (id, token, user_id, expires_at, created_at) VALUES ($1, $2, $3, $4, $5)",
    [randomUUID(), token, userId, expiresAt, now.toISOString()]
  );
  return token;
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000),
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await execute("DELETE FROM sessions WHERE token = $1", [token]);
  }
  store.delete(SESSION_COOKIE);
}

export const getCurrentUser = cache(async (): Promise<SafeUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const row = await queryOne<SafeUser>(
    `SELECT u.id, u.name, u.email, u.phone, u.address, u.role, u.points, u.created_at
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = $1 AND s.expires_at > $2`,
    [token, new Date().toISOString()]
  );

  return row ?? null;
});

export async function requireUser(): Promise<SafeUser | null> {
  return getCurrentUser();
}

export async function requireAdmin(): Promise<SafeUser | null> {
  const user = await getCurrentUser();
  return user?.role === "ADMIN" ? user : null;
}

export function toSafeUser(user: User): SafeUser {
  const { password_hash: _passwordHash, ...safe } = user;
  return safe;
}

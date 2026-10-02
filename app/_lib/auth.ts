import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { users, type User } from "../../db/schema";
import { createToken, SESSION_COOKIE, SESSION_MAX_AGE_S, verifyToken } from "./session-token";

export async function createSession(userId: number) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_S,
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

// Returns the logged-in user, or null. Use in route handlers (respond 401).
export const getSessionUser = cache(async (): Promise<User | null> => {
  const cookieStore = await cookies();
  const userId = verifyToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (userId === null) return null;
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user ?? null;
});

// Returns the logged-in user or redirects to /login. Users who have not
// finished the guided onboarding are sent there first. Use in pages.
export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.onboardingCompleted) redirect("/onboarding");
  return user;
}

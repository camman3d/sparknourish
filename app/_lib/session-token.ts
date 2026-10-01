import { createHmac, timingSafeEqual } from "node:crypto";

// Stateless session token: `<userId>.<expiresAtMs>.<hmac>`. Pure (no next/headers)
// so it can be shared by the proxy and server code.

export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE_S = 60 * 60 * 24 * 7;

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to a random string of at least 32 characters.");
  }
  return secret;
}

function sign(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createToken(userId: number) {
  const payload = `${userId}.${Date.now() + SESSION_MAX_AGE_S * 1000}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token: string | undefined): number | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiresAt, signature] = parts;

  const expected = Buffer.from(sign(`${userId}.${expiresAt}`));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  if (!Number.isFinite(Number(expiresAt)) || Number(expiresAt) < Date.now()) return null;
  const id = Number(userId);
  return Number.isInteger(id) ? id : null;
}

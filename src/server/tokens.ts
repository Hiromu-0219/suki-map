import { createHash, randomBytes } from "node:crypto";

export function createToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  const secret = process.env.EDIT_TOKEN_SECRET;
  if (!secret || secret.length < 32) throw new Error("EDIT_TOKEN_SECRET must be at least 32 characters");
  return createHash("sha256").update(`${secret}:${token}`).digest("hex");
}

export function createPublicId(): string {
  return randomBytes(12).toString("base64url");
}

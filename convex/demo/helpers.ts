// filepath: convex/demo/helpers.ts

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** Generates a 32-char alphanumeric token for demo invites. */
export function generateDemoToken(): string {
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return token;
}

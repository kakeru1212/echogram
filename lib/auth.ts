// lib/auth.ts
import { getSession } from '@auth0/nextjs-auth0';

export async function requireUserSession() {
  const session = await getSession();
  if (!session || !session.user) {
    throw new Error("未認証です");
  }
  return session.user;
}

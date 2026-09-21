import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth"; // Type-only import for inference

// @ts-ignore - Better Auth complex generic inference issue
export const authClient = createAuthClient<typeof auth>({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export const { signIn, signOut, useSession, getSession } = authClient;

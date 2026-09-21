import { db } from "../src/db";
import { user } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "../src/lib/auth";

async function seed() {
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!email || !password) {
    console.warn("⚠️ SUPERADMIN_EMAIL or SUPERADMIN_PASSWORD not set. Skipping seed.");
    process.exit(0);
  }

  // 1. Idempotency Check
  const existingAdmin = await db.query.user.findFirst({
    where: eq(user.email, email),
  });

  if (existingAdmin) {
    console.log("✅ Superadmin already exists. Ensuring admin role...");
    await db.update(user).set({ role: 'admin' }).where(eq(user.email, email));
    process.exit(0);
  }

  // 2. Secure Creation via Better Auth API
  console.log("🚀 Creating Superadmin account...");
  await auth.api.signUpEmail({
    body: {
      email,
      password,
      name: "Super Administrator",
    }
  });

  // 3. Assign Superadmin role
  await db.update(user).set({ role: 'admin' }).where(eq(user.email, email));

  console.log("✅ Superadmin created successfully.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Failed to seed superadmin:", err);
  process.exit(1);
});

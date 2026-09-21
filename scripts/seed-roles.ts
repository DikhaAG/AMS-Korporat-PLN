import { db } from "../src/db";
import { user, orgPositions } from "../src/db/schema";
import { eq, sql } from "drizzle-orm";
import { auth } from "../src/lib/auth";

// Helper to generate safe ID for ltree
const safeLtree = (id: string) => id.replace(/-/g, "_");

async function seedPositionsAndUsers() {
  console.log("🚀 Starting Seeder for Roles and Positions...");

  const positions: Record<string, any> = {};

  const posData = [
    { code: "EVP_MRE", title: "EVP MRE PLN", isSigner: true },
    { code: "GM_UID_S2JB", title: "GM UID S2JB PLN", isSigner: true },
    { code: "SM_REN", title: "SM REN", isSigner: true },
    { code: "SM_KEU", title: "SM KEU, KOM, DAN MUM", isSigner: true },
    { code: "SM_AGA", title: "SM AGA DAN MANJ GAN UID S2JB", isSigner: true },
    { code: "ASMAN_ADM", title: "ASMAN ADM GAN UID S2JB", isSigner: false },
    { code: "ASMAN_DAL", title: "ASMAN DAL PIUTANG UID S2JB", isSigner: false },
    { code: "ASMAN_DIG", title: "ASMAN DIG SERVICE DAN CUST EX UID S2JB", isSigner: false },
    { code: "ASMAN_BILLING", title: "ASMAN MANJ BILLING UID S2JB", isSigner: false },
    { code: "MAN_PNGMANAN", title: "MAN PNGMANAN PDPT UID S2JB", isSigner: false },
    { code: "MAN_STR_SAR", title: "MAN STR SAR UID S2JB", isSigner: false },
    { code: "MAN_YAN_GAN", title: "MAN YAN GAN UID S2JB", isSigner: false },
  ];

  for (const p of posData) {
    const existing = await db.query.orgPositions.findFirst({
      where: eq(orgPositions.code, p.code)
    });
    if (existing) {
      positions[p.code] = existing;
    } else {
      const [inserted] = await db.insert(orgPositions).values({
        code: p.code,
        title: p.title,
        isSigner: p.isSigner,
        hierarchyPath: sql`'temp'`
      }).returning();
      positions[p.code] = inserted;
    }
  }

  // Establish hierarchy and Paths
  const edges = [
    { parent: "EVP_MRE", child: "GM_UID_S2JB" },
    { parent: "GM_UID_S2JB", child: "SM_REN" },
    { parent: "GM_UID_S2JB", child: "SM_KEU" },
    { parent: "GM_UID_S2JB", child: "SM_AGA" },
    { parent: "SM_AGA", child: "ASMAN_ADM" },
    { parent: "SM_AGA", child: "ASMAN_DAL" },
    { parent: "SM_AGA", child: "ASMAN_DIG" },
    { parent: "SM_AGA", child: "ASMAN_BILLING" },
    { parent: "SM_AGA", child: "MAN_PNGMANAN" },
    { parent: "SM_AGA", child: "MAN_STR_SAR" },
    { parent: "SM_AGA", child: "MAN_YAN_GAN" },
  ];

  const paths: Record<string, string> = {
    "EVP_MRE": safeLtree(positions["EVP_MRE"].id)
  };

  for (const edge of edges) {
    paths[edge.child] = `${paths[edge.parent]}.${safeLtree(positions[edge.child].id)}`;
    await db.update(orgPositions)
      .set({ 
        parentId: positions[edge.parent].id,
        hierarchyPath: sql`${paths[edge.child]}::ltree`
      })
      .where(eq(orgPositions.id, positions[edge.child].id));
  }
  
  await db.update(orgPositions)
    .set({ hierarchyPath: sql`${paths["EVP_MRE"]}::ltree` })
    .where(eq(orgPositions.id, positions["EVP_MRE"].id));

  console.log("✅ Positions created/updated with hierarchy.");

  // 2. Create Users
  const userData = [
    { email: "evp.mre@pln.co.id", name: "EVP MRE", posCode: "EVP_MRE" },
    { email: "gm.s2jb@pln.co.id", name: "GM UID S2JB", posCode: "GM_UID_S2JB" },
    { email: "sm.ren@pln.co.id", name: "SM REN", posCode: "SM_REN" },
    { email: "sm.keu@pln.co.id", name: "SM KEU KOM MUM", posCode: "SM_KEU" },
    { email: "sm.aga@pln.co.id", name: "SM AGA (Hery Kurniawan)", posCode: "SM_AGA" },
    { email: "asman.adm@pln.co.id", name: "ASMAN ADM", posCode: "ASMAN_ADM" },
    { email: "asman.dal@pln.co.id", name: "ASMAN DAL PIUTANG", posCode: "ASMAN_DAL" },
  ];

  for (const u of userData) {
    if (!positions[u.posCode]) {
      console.warn(`Position ${u.posCode} not found in DB! Skipping user ${u.email}`);
      continue;
    }

    const existing = await db.query.user.findFirst({ where: eq(user.email, u.email) });
    if (!existing) {
      // Use better auth for secure insert (hashes password)
      const res = await auth.api.signUpEmail({
        body: {
          email: u.email,
          password: "password123",
          name: u.name,
        }
      });
      // The auth API created the user, now update position
      await db.update(user)
        .set({ positionId: positions[u.posCode].id })
        .where(eq(user.email, u.email));
      console.log(`👤 Created user: ${u.email}`);
    } else {
      await db.update(user)
        .set({ positionId: positions[u.posCode].id })
        .where(eq(user.email, u.email));
      console.log(`👤 Updated user position: ${u.email}`);
    }
  }

  console.log("🎉 Seeding complete! You can log in with any of the emails and 'password123'.");
  process.exit(0);
}

seedPositionsAndUsers().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});

import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { user, account, orgPositions } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const safeLtree = (id: string) => id.replace(/-/g, "_");

export async function GET(request: NextRequest) {
  return handleSeed(request);
}

export async function POST(request: NextRequest) {
  return handleSeed(request);
}

async function handleSeed(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providedSecret = searchParams.get("secret") || request.headers.get("x-seed-secret");
    const forceReset = searchParams.get("force") === "true" || searchParams.get("reset") === "true";
    
    // Allowed secret keys
    const validSecret = process.env.ADMIN_SEED_SECRET || process.env.BETTER_AUTH_SECRET || "pln-ams-seed-2026";

    if (!providedSecret || providedSecret !== validSecret) {
      return NextResponse.json(
        { 
          error: "Unauthorized", 
          message: "Invalid or missing secret key. Pass ?secret=YOUR_BETTER_AUTH_SECRET in URL or 'x-seed-secret' header." 
        },
        { status: 401 }
      );
    }

    const log: string[] = [];

    // 1. Seed Superadmin
    const superadminEmail = process.env.SUPERADMIN_EMAIL || "admin@pln.co.id";
    const superadminPassword = process.env.SUPERADMIN_PASSWORD || "AdminPLN2026!";

    const existingSuperadmin = await db.query.user.findFirst({
      where: eq(user.email, superadminEmail),
    });

    if (existingSuperadmin) {
      const userAccount = await db.query.account.findFirst({
        where: eq(account.userId, existingSuperadmin.id),
      });

      if (forceReset || !userAccount) {
        // If force reset or no account, delete and recreate cleanly with Better Auth
        await db.delete(account).where(eq(account.userId, existingSuperadmin.id));
        await db.delete(user).where(eq(user.id, existingSuperadmin.id));
        await auth.api.signUpEmail({
          body: {
            email: superadminEmail,
            password: superadminPassword,
            name: "Super Administrator",
          },
        });
        await db.update(user).set({ role: "admin" }).where(eq(user.email, superadminEmail));
        log.push(`Superadmin (${superadminEmail}) recreated with fresh Better Auth account credentials.`);
      } else {
        await db.update(user).set({ role: "admin" }).where(eq(user.email, superadminEmail));
        log.push(`Superadmin (${superadminEmail}) exists with valid account record: role ensured as admin.`);
      }
    } else {
      await auth.api.signUpEmail({
        body: {
          email: superadminEmail,
          password: superadminPassword,
          name: "Super Administrator",
        },
      });
      await db.update(user).set({ role: "admin" }).where(eq(user.email, superadminEmail));
      log.push(`Superadmin created: ${superadminEmail}`);
    }

    // 2. Seed Positions with Ltree Hierarchy
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

    const positions: Record<string, any> = {};

    for (const p of posData) {
      const existing = await db.query.orgPositions.findFirst({
        where: eq(orgPositions.code, p.code),
      });

      if (existing) {
        positions[p.code] = existing;
      } else {
        const [inserted] = await db.insert(orgPositions).values({
          code: p.code,
          title: p.title,
          isSigner: p.isSigner,
          hierarchyPath: sql`'temp'`,
        }).returning();
        positions[p.code] = inserted;
      }
    }

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
      EVP_MRE: safeLtree(positions["EVP_MRE"].id),
    };

    for (const edge of edges) {
      paths[edge.child] = `${paths[edge.parent]}.${safeLtree(positions[edge.child].id)}`;
      await db.update(orgPositions)
        .set({
          parentId: positions[edge.parent].id,
          hierarchyPath: sql`${paths[edge.child]}::ltree`,
        })
        .where(eq(orgPositions.id, positions[edge.child].id));
    }

    await db.update(orgPositions)
      .set({ hierarchyPath: sql`${paths["EVP_MRE"]}::ltree` })
      .where(eq(orgPositions.id, positions["EVP_MRE"].id));

    log.push(`Structured ${posData.length} organizational positions with hierarchy.`);

    // 3. Seed Users
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
      if (!positions[u.posCode]) continue;

      const existing = await db.query.user.findFirst({ where: eq(user.email, u.email) });
      if (!existing) {
        await auth.api.signUpEmail({
          body: {
            email: u.email,
            password: "password123",
            name: u.name,
          },
        });
        await db.update(user)
          .set({ positionId: positions[u.posCode].id })
          .where(eq(user.email, u.email));
        log.push(`Created user: ${u.email}`);
      } else {
        const userAccount = await db.query.account.findFirst({
          where: eq(account.userId, existing.id),
        });

        if (forceReset || !userAccount) {
          // Recreate cleanly with Better Auth
          await db.delete(account).where(eq(account.userId, existing.id));
          await db.delete(user).where(eq(user.id, existing.id));
          await auth.api.signUpEmail({
            body: {
              email: u.email,
              password: "password123",
              name: u.name,
            },
          });
          await db.update(user)
            .set({ positionId: positions[u.posCode].id })
            .where(eq(user.email, u.email));
          log.push(`User (${u.email}) recreated with fresh Better Auth account credentials.`);
        } else {
          await db.update(user)
            .set({ positionId: positions[u.posCode].id })
            .where(eq(user.email, u.email));
          log.push(`User (${u.email}) exists with valid account: updated position.`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      log,
      credentials: {
        superadmin: superadminEmail,
        demoUsersDefaultPassword: "password123",
      },
    });
  } catch (error: any) {
    console.error("API Seed error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to seed database" },
      { status: 500 }
    );
  }
}

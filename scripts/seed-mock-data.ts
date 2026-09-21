import { db } from "../src/db";
import { user, orgPositions, documents, documentTypeEnum, securityLevelEnum, urgencyLevelEnum, currentStatusEnum } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

async function seed() {
  console.log("🌱 Starting robust seed...");

  // 1. Ensure Superadmin Exists
  const email = process.env.SUPERADMIN_EMAIL || "admin@pln.co.id";
  const existingAdmin = await db.query.user.findFirst({
    where: eq(user.email, email),
  });

  if (!existingAdmin) {
    console.error("❌ Superadmin not found. Please run postbuild (seed-superadmin) first.");
    process.exit(1);
  }

  console.log("🏢 Seeding Organizational Hierarchy (ltree)...");

  // Define the hierarchy
  const dirUtamaId = randomUUID();
  const dirKeuId = randomUUID();
  const smKeuId = randomUUID();
  const asmanAkuntansiId = randomUUID();

  // Clear existing positions to prevent unique constraint errors during iterative testing
  await db.delete(documents);
  await db.delete(orgPositions);

  const positions = [
    {
      id: dirUtamaId,
      code: "DIR_UTAMA",
      title: "Direktur Utama",
      hierarchyPath: "DIR_UTAMA",
      isSigner: true,
    },
    {
      id: dirKeuId,
      code: "DIR_KEU",
      title: "Direktur Keuangan",
      parentId: dirUtamaId,
      hierarchyPath: "DIR_UTAMA.DIR_KEU",
      isSigner: true,
    },
    {
      id: smKeuId,
      code: "SM_KEU",
      title: "Senior Manager Keuangan",
      parentId: dirKeuId,
      hierarchyPath: "DIR_UTAMA.DIR_KEU.SM_KEU",
      isSigner: true,
    },
    {
      id: asmanAkuntansiId,
      code: "ASMAN_AKUNTANSI",
      title: "Asisten Manager Akuntansi",
      parentId: smKeuId,
      hierarchyPath: "DIR_UTAMA.DIR_KEU.SM_KEU.ASMAN_AKUNTANSI",
      isSigner: false,
    }
  ];

  await db.insert(orgPositions).values(positions);

  console.log("👤 Assigning Superadmin to DIR_UTAMA position...");
  await db.update(user).set({ positionId: dirUtamaId }).where(eq(user.id, existingAdmin.id));

  console.log("📄 Seeding Mock Documents for TanStack Tables...");

  const mockDocs = Array.from({ length: 45 }).map((_, i) => ({
    id: randomUUID(),
    documentType: "OUTGOING_LETTER" as const,
    documentNumber: i % 2 === 0 ? `00${i}/RHS/DIR_UTAMA/2026` : null,
    subject: `Laporan Keuangan Q${(i % 4) + 1} 2026 - Revisi ${i}`,
    bodyHtml: `<p>Ini adalah naskah simulasi untuk keperluan testing tabel.</p>`,
    securityLevel: "REGULAR" as const,
    urgencyLevel: i % 5 === 0 ? ("URGENT" as const) : ("REGULAR" as const),
    creatorUserId: existingAdmin.id,
    senderPositionId: dirUtamaId,
    currentStatus: i % 3 === 0 ? ("DRAFT" as const) : ("SIGNED_AND_PUBLISHED" as const),
  }));

  await db.insert(documents).values(mockDocs);

  console.log("✅ Seed complete! Your ltree and TanStack tables are ready for testing.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});

import { db } from "../src/db";
import { 
  user, 
  orgPositions, 
  documents, 
  documentRecipients, 
  documentApprovals, 
  dispositions,
  documentAuditTrails
} from "../src/db/schema";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

async function seedBenchmarkData() {
  console.log("🚀 Seeding realistic benchmark persuratan data for PLN AMS Korporat...");

  const evpPos = await db.query.orgPositions.findFirst({ where: eq(orgPositions.code, "EVP_MRE") });
  const gmPos = await db.query.orgPositions.findFirst({ where: eq(orgPositions.code, "GM_UID_S2JB") });
  const smAgaPos = await db.query.orgPositions.findFirst({ where: eq(orgPositions.code, "SM_AGA") });
  const smRenPos = await db.query.orgPositions.findFirst({ where: eq(orgPositions.code, "SM_REN") });
  const smKeuPos = await db.query.orgPositions.findFirst({ where: eq(orgPositions.code, "SM_KEU") });
  const asmanAdmPos = await db.query.orgPositions.findFirst({ where: eq(orgPositions.code, "ASMAN_ADM") });

  const evpUser = await db.query.user.findFirst({ where: eq(user.email, "evp.mre@pln.co.id") });
  const gmUser = await db.query.user.findFirst({ where: eq(user.email, "gm.s2jb@pln.co.id") });
  const smAgaUser = await db.query.user.findFirst({ where: eq(user.email, "sm.aga@pln.co.id") });
  const asmanUser = await db.query.user.findFirst({ where: eq(user.email, "asman.adm@pln.co.id") });

  if (!smAgaPos || !smAgaUser || !asmanAdmPos || !asmanUser || !evpPos || !gmPos) {
    console.error("❌ Required positions or users missing. Run seed-roles first!");
    process.exit(1);
  }

  // 1. Create a Document PENDING REVIEW by SM AGA (Drafter: ASMAN ADM -> Reviewer/Signer: SM AGA)
  const pendingDocId = randomUUID();
  await db.insert(documents).values({
    id: pendingDocId,
    documentType: "DINAS_NOTE",
    documentNumber: null, // Draft / In review
    agendaNumber: "9680/MRK.00.03/2026",
    classificationCode: "UMUM",
    subject: "Usulan Pengadaan Peralatan K3 dan Perlengkapan Posko Siaga Keandalan UID S2JB",
    bodyHtml: `
      <div style="font-family: 'Times New Roman', serif; line-height: 1.6;">
        <h3 style="text-align: center; text-transform: uppercase; margin-bottom: 20px;">
          <strong>NOTA DINAS</strong>
        </h3>
        <table style="width: 100%; margin-bottom: 20px; font-size: 14px;">
          <tr><td style="width: 120px;"><strong>Kepada</strong></td><td>: SM AGA DAN MANJ GAN UID S2JB</td></tr>
          <tr><td><strong>Dari</strong></td><td>: ASMAN ADM GAN UID S2JB</td></tr>
          <tr><td><strong>Tanggal</strong></td><td>: 21 September 2026</td></tr>
          <tr><td><strong>Sifat</strong></td><td>: Segera / Penting</td></tr>
          <tr><td><strong>Hal</strong></td><td>: <strong>Usulan Pengadaan Peralatan K3 dan Perlengkapan Posko Siaga</strong></td></tr>
        </table>
        <hr style="border: 1px solid #333; margin-bottom: 20px;" />
        <p>1. Sehubungan dengan program peningkatan keselamatan kerja (K3) dan kesiapan posko siaga keandalan kelistrikan semester II tahun 2026, bersama ini kami sampaikan usulan pengadaan peralatan APD dan perkakas keselamatan kerja.</p>
        <p>2. Rincian kebutuhan anggaran dan spesifikasi teknis terlampir dalam dokumen pendukung untuk mendapatkan persetujuan dan pengesahan TTE Bapak Senior Manager.</p>
        <p>3. Demikian kami sampaikan, atas perhatian dan persetujuan Bapak kami ucapkan terima kasih.</p>
      </div>
    `,
    securityLevel: "REGULAR",
    urgencyLevel: "URGENT",
    creatorUserId: asmanUser.id,
    senderPositionId: asmanAdmPos.id,
    currentStatus: "IN_REVIEW",
    isLocked: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Add Recipients for pending doc
  await db.insert(documentRecipients).values({
    documentId: pendingDocId,
    positionId: smAgaPos.id,
    recipientType: "PRIMARY",
  });

  // Add Pending Approval for SM AGA
  await db.insert(documentApprovals).values({
    documentId: pendingDocId,
    reviewerPositionId: smAgaPos.id,
    stepOrder: 1,
    approvalRole: "FINAL_SIGNER",
    actionStatus: "PENDING",
  });

  console.log(`✅ Seeded Pending Review Document for SM AGA: ${pendingDocId}`);

  // 2. Create Published Documents (Matching Benchmark Images 1, 2, 3, 4, 5)
  const benchmarkDocs = [
    {
      docNumber: "47294/MRK.00.03/F01090300/2026",
      agenda: "9677/MRK.00.03/2026",
      subject: "Penyampaian Early Warning System (EWS) Risiko Kecelakaan Kerja PLN Holding",
      senderPos: evpPos,
      creator: evpUser || smAgaUser,
      body: "<p>Bersama ini disampaikan panduan mitigasi dini Early Warning System (EWS) keselamatan kerja seluruh unit holding PT PLN (Persero) untuk segera disosialisasikan dan ditindaklanjuti.</p>",
      dispositionFrom: gmPos, // Disposed by GM to SM AGA
      actionChecklist: ["Untuk Diketahui", "ACC Untuk Ditindak Lanjuti", "Ambil Langkah Seperlunya"],
      notes: "Mohon SM AGA lakukan tindak lanjut dan koordinasi ke seluruh asman.",
    },
    {
      docNumber: "46804/STI.02.02/F01000400/2026",
      agenda: "9678/STI.02.02/2026",
      subject: "Penguatan dan peningkatan Keamanan di lingkungan Operational Technology (OT)",
      senderPos: evpPos,
      creator: evpUser || smAgaUser,
      body: "<p>Pemberitahuan instruksi pengamanan aset Operational Technology (OT) dan SCADA terhadap ancaman siber.</p>",
      dispositionFrom: null,
      actionChecklist: [],
      notes: "",
    },
    {
      docNumber: "2188/HKM.00.04/GM/2026",
      agenda: "9679/HKM.00.04/2026",
      subject: "Penyampaian SK User Champion SAP S/4HANA dan Success Factors PT PLN (Persero) UID S2JB",
      senderPos: gmPos,
      creator: gmUser || smAgaUser,
      body: "<p>Surat Keputusan General Manager terkait penugasan tim User Champion implementasi SAP S/4HANA Go-Live 2026.</p>",
      dispositionFrom: null,
      actionChecklist: [],
      notes: "",
    },
    {
      docNumber: "2197/REN.00.03/SM REN/2026",
      agenda: "9681/REN.00.03/2026",
      subject: "Penyampaian Surat Ketetapan Anggaran Investasi (SKAI) Tahun 2026 – Revisi 2",
      senderPos: smRenPos || gmPos,
      creator: gmUser || smAgaUser,
      body: "<p>Penyampaian alokasi anggaran investasi RKAP 2026 revisi kedua untuk unit operasional.</p>",
      dispositionFrom: null,
      actionChecklist: [],
      notes: "",
    },
    {
      docNumber: "1869/KLH.02.02/GM/2026",
      agenda: "9682/KLH.02.02/2026",
      subject: "Penyampaian Ketentuan Pelaksanaan Magang di Kantor PT PLN (Persero) UID S2JB",
      senderPos: gmPos,
      creator: gmUser || smAgaUser,
      body: "<p>Ketentuan dan pedoman pembinaan peserta program magang bersertifikat industri kelistrikan.</p>",
      dispositionFrom: null,
      actionChecklist: [],
      notes: "",
    },
  ];

  for (const b of benchmarkDocs) {
    const docId = randomUUID();
    await db.insert(documents).values({
      id: docId,
      documentType: "DINAS_NOTE",
      documentNumber: b.docNumber,
      agendaNumber: b.agenda,
      classificationCode: "UMUM",
      subject: b.subject,
      bodyHtml: b.body,
      securityLevel: "REGULAR",
      urgencyLevel: "REGULAR",
      creatorUserId: b.creator.id,
      senderPositionId: b.senderPos.id,
      currentStatus: "SIGNED_AND_PUBLISHED",
      isLocked: true,
      retentionActiveDate: "2028-09-07",
      retentionInactiveDate: "2031-09-07",
      createdAt: new Date("2026-09-07T08:00:00Z"),
      updatedAt: new Date("2026-09-14T19:04:27Z"),
    });

    // Make SM AGA a primary recipient
    await db.insert(documentRecipients).values({
      documentId: docId,
      positionId: smAgaPos.id,
      recipientType: "PRIMARY",
    });

    // If there is an active disposition to SM AGA (Benchmark Image 5 scenario)
    if (b.dispositionFrom) {
      await db.insert(dispositions).values({
        documentId: docId,
        fromPositionId: b.dispositionFrom.id,
        toPositionId: smAgaPos.id,
        transmissionMode: "DISPOSITION",
        dispositionType: "OPEN",
        actionChecklist: b.actionChecklist,
        instructionNotes: b.notes,
        createdAt: new Date("2026-09-14T19:05:00Z"),
      });
    }

    console.log(`✅ Seeded Published Document: ${b.docNumber}`);
  }

  console.log("🎉 Seeding completed successfully! SM AGA Inbox now contains realistic benchmark data.");
  process.exit(0);
}

seedBenchmarkData().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});

import { z } from "zod";
import { createTRPCRouter, protectedPositionProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { 
  documents, 
  documentApprovals, 
  documentAuditTrails, 
  orgPositions,
  dispositions,
  documentRecipients,
  documentCounters
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { 
  createDocumentDraftSchema, 
  documentReviewActionSchema,
  getDocumentsSchema,
  dispositionActionSchema
} from "@/shared/schemas/document";

export const documentRouter = createTRPCRouter({
  createDraft: protectedPositionProcedure
    .input(createDocumentDraftSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const [newDoc] = await tx
          .insert(documents)
          .values({
            documentType: input.documentType,
            subject: input.subject,
            bodyHtml: input.bodyHtml,
            securityLevel: input.securityLevel,
            urgencyLevel: input.urgencyLevel,
            agendaNumber: input.agendaNumber,
            classificationCode: input.classificationCode,
            creatorUserId: ctx.user.id,
            senderPositionId: ctx.activePositionId,
            currentStatus: "IN_REVIEW",
            isLocked: true,
          })
          .returning();

        await tx.insert(documentAuditTrails).values({
          documentId: newDoc.id,
          actorUserId: ctx.user.id,
          eventType: "DRAFT_CREATED_AND_SUBMITTED",
          ipAddress: ctx.headers.get("x-forwarded-for") || null,
          userAgent: ctx.headers.get("user-agent") || null,
          statePayload: { status: "IN_REVIEW" },
        });

        const recipientsToInsert = [
          ...input.recipientPositionIds.map(posId => ({
            documentId: newDoc.id,
            positionId: posId,
            recipientType: "PRIMARY" as const,
          })),
          ...(input.ccPositionIds || []).map(posId => ({
            documentId: newDoc.id,
            positionId: posId,
            recipientType: "CC" as const,
          }))
        ];
        
        if (recipientsToInsert.length > 0) {
          await tx.insert(documentRecipients).values(recipientsToInsert);
        }

        // Auto-assign first recipient or parent superior as reviewer
        const [senderPos] = await tx
          .select()
          .from(orgPositions)
          .where(eq(orgPositions.id, ctx.activePositionId));

        const targetReviewerId = senderPos?.parentId || input.recipientPositionIds[0];
        if (targetReviewerId) {
          await tx.insert(documentApprovals).values({
            documentId: newDoc.id,
            reviewerPositionId: targetReviewerId,
            stepOrder: 1,
            approvalRole: "FINAL_SIGNER",
            actionStatus: "PENDING",
          });
        }

        return newDoc;
      });
    }),

  submitForReview: protectedPositionProcedure
    .input(z.object({ documentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const [doc] = await tx
          .select()
          .from(documents)
          .where(and(
            eq(documents.id, input.documentId),
            eq(documents.senderPositionId, ctx.activePositionId)
          ));

        if (!doc) throw new TRPCError({ code: "NOT_FOUND" });
        if (doc.currentStatus !== "DRAFT" && doc.currentStatus !== "NEEDS_REVISION") {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "Document is not in a draft state." 
          });
        }

        const [updatedDoc] = await tx
          .update(documents)
          .set({ currentStatus: "IN_REVIEW", isLocked: true })
          .where(eq(documents.id, input.documentId))
          .returning();

        await tx.insert(documentAuditTrails).values({
          documentId: updatedDoc.id,
          actorUserId: ctx.user.id,
          eventType: "SUBMITTED_FOR_REVIEW",
          ipAddress: ctx.headers.get("x-forwarded-for") || null,
          userAgent: ctx.headers.get("user-agent") || null,
          statePayload: { oldStatus: doc.currentStatus, newStatus: "IN_REVIEW" },
        });

        return updatedDoc;
      });
    }),

  reviewDocument: protectedPositionProcedure
    .input(documentReviewActionSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const [doc] = await tx
          .select()
          .from(documents)
          .where(eq(documents.id, input.documentId));

        if (!doc) throw new TRPCError({ code: "NOT_FOUND" });
        if (doc.currentStatus !== "IN_REVIEW") {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "Document is not currently under review." 
          });
        }

        // Logic for final signer vs regular reviewer could be complex
        // For simplicity, we assume if APPROVED by the sender's parent, it becomes final
        
        let newStatus: "DRAFT" | "IN_REVIEW" | "NEEDS_REVISION" | "APPROVED" | "SIGNED_AND_PUBLISHED" | "REJECTED" | "CANCELLED" = doc.currentStatus;
        if (input.actionStatus === "REJECTED") {
          newStatus = "REJECTED";
        } else if (input.actionStatus === "REVISED") {
          newStatus = "NEEDS_REVISION";
        } else if (input.actionStatus === "APPROVED") {
          // Check if this position is a signer
          const [position] = await tx
            .select()
            .from(orgPositions)
            .where(eq(orgPositions.id, ctx.activePositionId));
            
          if (position && position.isSigner) {
            newStatus = "SIGNED_AND_PUBLISHED";
            
            // Atomic Numbering Logic
            const year = new Date().getFullYear();
            const classCode = doc.classificationCode || "UMUM";
            
            const [counter] = await tx
              .select()
              .from(documentCounters)
              .where(and(
                eq(documentCounters.classificationCode, classCode),
                eq(documentCounters.year, year)
              ))
              .for('update');
            
            const nextSeq = (counter?.currentSequence ?? 0) + 1;
            
            await tx
              .insert(documentCounters)
              .values({ classificationCode: classCode, year, currentSequence: nextSeq })
              .onConflictDoUpdate({
                target: [documentCounters.classificationCode, documentCounters.year],
                set: { currentSequence: nextSeq }
              });

            const paddedSeq = nextSeq.toString().padStart(4, '0');
            const newDocumentNumber = `${paddedSeq}/${classCode}/${position.code}/${year}`;
            
            await tx.update(documents)
              .set({ documentNumber: newDocumentNumber })
              .where(eq(documents.id, input.documentId));
              
            // Enqueue PDF generation background job
            const { getBoss } = await import('@/lib/queue');
            const boss = await getBoss();
            // In pg-boss, jobs can be transactional if we pass the db connection, but doing it here is fine since the tx completes right after.
            await boss.send('generate-pdf', { documentId: input.documentId });
          } else {
            // Wait for next approval step
            newStatus = "IN_REVIEW"; 
          }
        }

        const [updatedDoc] = await tx
          .update(documents)
          .set({ 
            currentStatus: newStatus,
            isLocked: newStatus !== "NEEDS_REVISION" && newStatus !== "REJECTED"
          })
          .where(eq(documents.id, input.documentId))
          .returning();

        // Record Approval Action
        await tx.insert(documentApprovals).values({
          documentId: doc.id,
          reviewerPositionId: ctx.activePositionId,
          actualReviewerUserId: ctx.user.id,
          stepOrder: 1, // Simplified for now
          approvalRole: newStatus === "SIGNED_AND_PUBLISHED" ? "FINAL_SIGNER" : "VERIFIER_PARAF",
          actionStatus: input.actionStatus,
          notes: input.notes,
          actedAt: new Date(),
        });

        // Record Audit Trail
        await tx.insert(documentAuditTrails).values({
          documentId: doc.id,
          actorUserId: ctx.user.id,
          eventType: `DOCUMENT_${input.actionStatus}`,
          ipAddress: ctx.headers.get("x-forwarded-for") || null,
          userAgent: ctx.headers.get("user-agent") || null,
          statePayload: { oldStatus: doc.currentStatus, newStatus },
        });

        return updatedDoc;
      }, { isolationLevel: "serializable" });
    }),
    
  getDocuments: protectedPositionProcedure
    .input(getDocumentsSchema)
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.limit;
      const conditions = [];

      // If OUTBOX, show documents sent by the active position.
      // If INBOX, check pending reviews, final recipients, or explicitly forwarded dispositions.
      if (input.type === "OUTBOX") {
        conditions.push(eq(documents.senderPositionId, ctx.activePositionId));
      } else if (input.type === "INBOX") {
        conditions.push(sql`
          EXISTS (
            SELECT 1 FROM ${documentApprovals} da
            WHERE da.document_id = ${documents.id}
            AND da.reviewer_position_id = ${ctx.activePositionId}
            AND da.action_status = 'PENDING'
          )
          OR EXISTS (
            SELECT 1 FROM ${documentRecipients} dr
            WHERE dr.document_id = ${documents.id}
            AND dr.position_id = ${ctx.activePositionId}
            AND ${documents.currentStatus} = 'SIGNED_AND_PUBLISHED'
          )
          OR EXISTS (
            SELECT 1 FROM ${dispositions} dsp
            WHERE dsp.document_id = ${documents.id}
            AND dsp.to_position_id = ${ctx.activePositionId}
          )
        `);
      }

      if (input.status) {
        conditions.push(eq(documents.currentStatus, input.status));
      }

      if (input.search) {
        conditions.push(
          sql`(${documents.subject} ILIKE ${'%' + input.search + '%'} 
          OR ${documents.documentNumber} ILIKE ${'%' + input.search + '%'} 
          OR ${documents.agendaNumber} ILIKE ${'%' + input.search + '%'})`
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [countResult] = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(documents)
        .where(whereClause);

      const totalCount = Number(countResult.count);
      const pageCount = Math.ceil(totalCount / input.limit);

      const items = await ctx.db
        .select({
          id: documents.id,
          documentNumber: documents.documentNumber,
          subject: documents.subject,
          documentType: documents.documentType,
          currentStatus: documents.currentStatus,
          securityLevel: documents.securityLevel,
          createdAt: documents.createdAt,
          updatedAt: documents.updatedAt,
          senderPositionTitle: orgPositions.title,
          senderPositionCode: orgPositions.code,
        })
        .from(documents)
        .leftJoin(orgPositions, eq(documents.senderPositionId, orgPositions.id))
        .where(whereClause)
        .orderBy(sql`${documents.updatedAt} DESC`)
        .limit(input.limit)
        .offset(offset);

      return {
        items,
        totalCount,
        pageCount,
      };
    }),
    
  getDocument: protectedPositionProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const doc = await ctx.db.query.documents.findFirst({
        where: eq(documents.id, input.id),
        with: {
          creator: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
          senderPosition: true,
          recipients: {
            with: {
              position: true,
            },
          },
          approvals: {
            with: {
              reviewerPosition: true,
              actualReviewerUser: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: (approvals, { asc }) => [asc(approvals.stepOrder), asc(approvals.actedAt)],
          },
          dispositions: {
            with: {
              fromPosition: true,
              toPosition: true,
            },
            orderBy: (dispositions, { asc }) => [asc(dispositions.createdAt)],
          },
        },
      });

      if (!doc) throw new TRPCError({ code: "NOT_FOUND" });

      // Fetch active position details
      const [currentPosition] = await ctx.db
        .select()
        .from(orgPositions)
        .where(eq(orgPositions.id, ctx.activePositionId));

      const isSigner = Boolean(currentPosition?.isSigner);
      
      // Determine if active user can review this document
      const hasPendingApproval = doc.approvals?.some(
        (a) => a.reviewerPositionId === ctx.activePositionId && a.actionStatus === "PENDING"
      );
      const canReview = doc.currentStatus === "IN_REVIEW" && (hasPendingApproval || isSigner);

      // Determine if active user can disposition
      const isRecipient = doc.recipients?.some((r) => r.positionId === ctx.activePositionId);
      const isSender = doc.senderPositionId === ctx.activePositionId;
      const hasReceivedDisposition = doc.dispositions?.some((d) => d.toPositionId === ctx.activePositionId);
      const canDisposition = doc.currentStatus === "SIGNED_AND_PUBLISHED" && (isRecipient || isSender || hasReceivedDisposition);

      // Filter active dispositions targeted to current position
      const myActiveDispositions = doc.dispositions?.filter(
        (d) => d.toPositionId === ctx.activePositionId
      ) || [];

      // Calculate retention periods if null
      const createdDate = new Date(doc.createdAt);
      const activeEnd = doc.retentionActiveDate 
        ? new Date(doc.retentionActiveDate) 
        : new Date(createdDate.getFullYear() + 2, createdDate.getMonth(), createdDate.getDate());
      const inactiveEnd = doc.retentionInactiveDate 
        ? new Date(doc.retentionInactiveDate) 
        : new Date(activeEnd.getFullYear() + 3, activeEnd.getMonth(), activeEnd.getDate());

      return {
        ...doc,
        retentionActiveDate: activeEnd.toISOString(),
        retentionInactiveDate: inactiveEnd.toISOString(),
        currentPosition,
        isSigner,
        canReview,
        canDisposition,
        myActiveDispositions,
      };
    }),

  createDisposition: protectedPositionProcedure
    .input(dispositionActionSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const [doc] = await tx
          .select()
          .from(documents)
          .where(eq(documents.id, input.documentId));

        if (!doc) throw new TRPCError({ code: "NOT_FOUND" });

        const [newDisposition] = await tx
          .insert(dispositions)
          .values({
            documentId: input.documentId,
            fromPositionId: ctx.activePositionId,
            toPositionId: input.toPositionId,
            transmissionMode: input.transmissionMode || "DISPOSITION",
            dispositionType: input.dispositionType,
            actionChecklist: input.actionChecklist,
            instructionNotes: input.instructionNotes,
            deadline: input.deadline ? new Date(input.deadline) : null,
          })
          .returning();

        await tx.insert(documentAuditTrails).values({
          documentId: doc.id,
          actorUserId: ctx.user.id,
          eventType: input.transmissionMode === "FORWARD" ? "DOCUMENT_FORWARDED" : "DISPOSITION_CREATED",
          ipAddress: ctx.headers.get("x-forwarded-for") || null,
          userAgent: ctx.headers.get("user-agent") || null,
          statePayload: { 
            dispositionId: newDisposition.id, 
            toPositionId: input.toPositionId,
            transmissionMode: input.transmissionMode 
          },
        });

        return newDisposition;
      });
    }),

  getRecipientPositions: protectedPositionProcedure
    .query(async ({ ctx }) => {
      const positions = await ctx.db
        .select({
          id: orgPositions.id,
          title: orgPositions.title,
          code: orgPositions.code,
        })
        .from(orgPositions)
        .orderBy(orgPositions.title);
      return positions;
    }),
});

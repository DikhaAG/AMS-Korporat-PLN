import { z } from "zod";
import { createTRPCRouter, protectedPositionProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { dispositions, orgPositions, documents, documentAuditTrails } from "@/db/schema";
import { eq, or, and, sql } from "drizzle-orm";
import { 
  createDispositionSchema, 
  updateExecutionStatusSchema 
} from "@/shared/schemas/disposition";

export const dispositionRouter = createTRPCRouter({
  create: protectedPositionProcedure
    .input(createDispositionSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        // Validate document exists and is published
        const [doc] = await tx
          .select()
          .from(documents)
          .where(eq(documents.id, input.documentId));

        if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
        if (doc.currentStatus !== "SIGNED_AND_PUBLISHED") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Can only disposition published documents" });
        }

        // Validate target position
        const [targetPos] = await tx
          .select()
          .from(orgPositions)
          .where(eq(orgPositions.id, input.toPositionId));

        if (!targetPos) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Target position not found" });
        }

        // PBAC: verify that the target position is a descendant of the sender position
        // In a real implementation we would check the ltree hierarchy path
        // e.g. targetPos.hierarchyPath <@ currentPos.hierarchyPath
        
        const [newDisposition] = await tx
          .insert(dispositions)
          .values({
            documentId: input.documentId,
            parentDispositionId: input.parentDispositionId || null,
            fromPositionId: ctx.activePositionId,
            toPositionId: input.toPositionId,
            dispositionType: input.dispositionType,
            actionChecklist: input.actionChecklist,
            instructionNotes: input.instructionNotes,
            deadline: input.deadline ? new Date(input.deadline) : null,
          })
          .returning();

        // Record Audit Trail
        await tx.insert(documentAuditTrails).values({
          documentId: doc.id,
          actorUserId: ctx.user.id,
          eventType: "DISPOSITION_CREATED",
          ipAddress: ctx.headers.get("x-forwarded-for") || null,
          userAgent: ctx.headers.get("user-agent") || null,
          statePayload: { dispositionId: newDisposition.id },
        });

        return newDisposition;
      });
    }),

  updateStatus: protectedPositionProcedure
    .input(updateExecutionStatusSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const [disp] = await tx
          .select()
          .from(dispositions)
          .where(eq(dispositions.id, input.dispositionId));

        if (!disp) throw new TRPCError({ code: "NOT_FOUND" });
        
        // PBAC: only the target position can update the status
        if (disp.toPositionId !== ctx.activePositionId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to update this disposition" });
        }

        const updateData: any = {
          executionStatus: input.executionStatus,
        };

        if (input.executionStatus === "COMPLETED") {
          updateData.completedAt = new Date();
          if (input.completionReport) {
            updateData.completionReport = input.completionReport;
          }
        }

        const [updatedDisp] = await tx
          .update(dispositions)
          .set(updateData)
          .where(eq(dispositions.id, input.dispositionId))
          .returning();

        // Record Audit Trail
        await tx.insert(documentAuditTrails).values({
          documentId: disp.documentId,
          actorUserId: ctx.user.id,
          eventType: "DISPOSITION_UPDATED",
          ipAddress: ctx.headers.get("x-forwarded-for") || null,
          userAgent: ctx.headers.get("user-agent") || null,
          statePayload: { dispositionId: updatedDisp.id, status: input.executionStatus },
        });

        return updatedDisp;
      });
    }),

  getIncoming: protectedPositionProcedure
    .query(async ({ ctx }) => {
      // Get all dispositions assigned to the current position
      return await ctx.db.query.dispositions.findMany({
        where: eq(dispositions.toPositionId, ctx.activePositionId),
        with: {
          document: true,
          fromPosition: true,
        },
        orderBy: (dispositions, { desc }) => [desc(dispositions.createdAt)],
      });
    }),

  getOutgoing: protectedPositionProcedure
    .query(async ({ ctx }) => {
      // Get all dispositions created by the current position
      return await ctx.db.query.dispositions.findMany({
        where: eq(dispositions.fromPositionId, ctx.activePositionId),
        with: {
          document: true,
          toPosition: true,
        },
        orderBy: (dispositions, { desc }) => [desc(dispositions.createdAt)],
      });
    }),
});

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { user, orgPositions, documentApprovals } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const userRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const currentUser = await ctx.db.query.user.findFirst({
      where: eq(user.id, ctx.user.id),
      with: {
        position: true,
      },
    });

    if (!currentUser) {
      return null;
    }

    // Calculate pending approval notifications if user has a position
    let pendingCount = 0;
    if (currentUser.positionId) {
      const pendingApprovals = await ctx.db
        .select({ id: documentApprovals.id })
        .from(documentApprovals)
        .where(
          and(
            eq(documentApprovals.reviewerPositionId, currentUser.positionId),
            eq(documentApprovals.actionStatus, "PENDING")
          )
        );
      pendingCount = pendingApprovals.length;
    }

    return {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      image: currentUser.image,
      nip: currentUser.nip,
      role: currentUser.role,
      position: currentUser.position ? {
        id: currentUser.position.id,
        code: currentUser.position.code,
        title: currentUser.position.title,
        isSigner: currentUser.position.isSigner,
      } : null,
      pendingCount,
    };
  }),
});

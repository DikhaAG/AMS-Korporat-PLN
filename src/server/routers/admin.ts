import { z } from "zod";
import { createTRPCRouter, protectedAdminProcedure } from "../trpc";
import { user, session, account, positionDelegations, orgPositions, documents, documentAuditTrails, systemSettings } from "@/db/schema";
import { eq, ne, and, sql, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { auth } from "@/lib/auth";
import { hashPassword } from "better-auth/crypto";
import { createUserSchema, updateUserSchema, deleteUserSchema } from "@/shared/schemas/user";

export const adminRouter = createTRPCRouter({
  // ---- USERS ----
  getUsers: protectedAdminProcedure
    .query(async ({ ctx }) => {
      const users = await ctx.db.select().from(user).orderBy(user.name);
      return users;
    }),

  createUser: protectedAdminProcedure
    .input(createUserSchema)
    .mutation(async ({ ctx, input }) => {
      // 1. Check if email already exists
      const existingEmail = await ctx.db.query.user.findFirst({
        where: eq(user.email, input.email),
      });
      if (existingEmail) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email sudah terdaftar dalam sistem.",
        });
      }

      // 2. Check NIP uniqueness if provided
      if (input.nip && input.nip.trim() !== "") {
        const existingNip = await ctx.db.query.user.findFirst({
          where: eq(user.nip, input.nip.trim()),
        });
        if (existingNip) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "NIP sudah terdaftar untuk pengguna lain.",
          });
        }
      }

      // 3. Check position validity if assigned
      const targetPosId = input.positionId && input.positionId.trim() !== "" ? input.positionId : null;
      if (targetPosId) {
        const pos = await ctx.db.query.orgPositions.findFirst({
          where: eq(orgPositions.id, targetPosId),
        });
        if (!pos) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Jabatan struktural tidak ditemukan.",
          });
        }
      }

      // 4. Create user with credentials via Better Auth
      try {
        await auth.api.signUpEmail({
          body: {
            email: input.email,
            password: input.password,
            name: input.name,
          },
        });
      } catch (authError: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: authError.message || "Gagal membuat akun autentikasi pengguna.",
        });
      }

      // 5. Update user extensions (NIP, role, position)
      const [createdUser] = await ctx.db
        .update(user)
        .set({
          nip: input.nip && input.nip.trim() !== "" ? input.nip.trim() : null,
          role: input.role,
          positionId: targetPosId,
        })
        .where(eq(user.email, input.email))
        .returning();

      if (!createdUser) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Pengguna dibuat tetapi gagal memperbarui profil tambahan.",
        });
      }

      return createdUser;
    }),

  updateUser: protectedAdminProcedure
    .input(updateUserSchema)
    .mutation(async ({ ctx, input }) => {
      // 1. Verify target user exists
      const existingUser = await ctx.db.query.user.findFirst({
        where: eq(user.id, input.id),
      });
      if (!existingUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pengguna tidak ditemukan." });
      }

      // 2. Check email uniqueness if modified
      if (input.email !== existingUser.email) {
        const duplicateEmail = await ctx.db.query.user.findFirst({
          where: and(eq(user.email, input.email), ne(user.id, input.id)),
        });
        if (duplicateEmail) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email sudah digunakan oleh pengguna lain.",
          });
        }
      }

      // 3. Check NIP uniqueness if modified
      const cleanNip = input.nip && input.nip.trim() !== "" ? input.nip.trim() : null;
      if (cleanNip && cleanNip !== existingUser.nip) {
        const duplicateNip = await ctx.db.query.user.findFirst({
          where: and(eq(user.nip, cleanNip), ne(user.id, input.id)),
        });
        if (duplicateNip) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "NIP sudah digunakan oleh pengguna lain.",
          });
        }
      }

      // 4. Check position validity if assigned
      const targetPosId = input.positionId && input.positionId.trim() !== "" ? input.positionId : null;
      if (targetPosId) {
        const pos = await ctx.db.query.orgPositions.findFirst({
          where: eq(orgPositions.id, targetPosId),
        });
        if (!pos) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Jabatan struktural tidak ditemukan.",
          });
        }
      }

      // 5. Update user profile details in database
      const [updatedUser] = await ctx.db
        .update(user)
        .set({
          name: input.name,
          email: input.email,
          nip: cleanNip,
          role: input.role,
          positionId: targetPosId,
          updatedAt: new Date(),
        })
        .where(eq(user.id, input.id))
        .returning();

      // 6. If new password provided, update credentials in account table
      if (input.newPassword && input.newPassword.trim() !== "") {
        const hashedPassword = await hashPassword(input.newPassword.trim());
        const existingAccount = await ctx.db.query.account.findFirst({
          where: and(eq(account.userId, input.id), eq(account.providerId, "credential")),
        });

        if (existingAccount) {
          await ctx.db
            .update(account)
            .set({ password: hashedPassword, updatedAt: new Date() })
            .where(eq(account.id, existingAccount.id));
        } else {
          await ctx.db.insert(account).values({
            id: crypto.randomUUID(),
            accountId: input.id,
            providerId: "credential",
            userId: input.id,
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }

      return updatedUser;
    }),

  deleteUser: protectedAdminProcedure
    .input(deleteUserSchema)
    .mutation(async ({ ctx, input }) => {
      // 1. Prevent deleting self
      if (input.id === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Anda tidak dapat menghapus akun Anda sendiri.",
        });
      }

      // 2. Prevent deleting the last superadmin
      const targetUser = await ctx.db.query.user.findFirst({
        where: eq(user.id, input.id),
      });
      if (!targetUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pengguna tidak ditemukan." });
      }

      if (targetUser.role === "admin") {
        const adminCount = await ctx.db
          .select({ id: user.id })
          .from(user)
          .where(eq(user.role, "admin"));
        if (adminCount.length <= 1) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Tidak dapat menghapus Superadmin terakhir dalam sistem.",
          });
        }
      }

      // 3. Check for active delegations
      const delegations = await ctx.db
        .select({ id: positionDelegations.id })
        .from(positionDelegations)
        .where(eq(positionDelegations.delegateeUserId, input.id))
        .limit(1);
      if (delegations.length > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Pengguna memiliki penugasan delegasi aktif. Batalkan delegasi terlebih dahulu.",
        });
      }

      // 4. Safe cascade deletion in database transaction
      return await ctx.db.transaction(async (tx) => {
        await tx.delete(session).where(eq(session.userId, input.id));
        await tx.delete(account).where(eq(account.userId, input.id));
        const [deleted] = await tx.delete(user).where(eq(user.id, input.id)).returning();
        return { success: true, deletedUser: deleted };
      });
    }),

  updateUserRole: protectedAdminProcedure
    .input(z.object({
      userId: z.string(),
      role: z.enum(["admin", "user"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const [updatedUser] = await ctx.db
        .update(user)
        .set({ role: input.role })
        .where(eq(user.id, input.userId))
        .returning();
      
      if (!updatedUser) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      return updatedUser;
    }),
  // ---- USERS & POSITIONS ASSIGNMENTS ----
  getUsersByPosition: protectedAdminProcedure
    .input(z.object({
      positionId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const users = await ctx.db
        .select()
        .from(user)
        .where(eq(user.positionId, input.positionId))
        .orderBy(user.name);
      return users;
    }),

  assignUserToPosition: protectedAdminProcedure
    .input(z.object({
      userId: z.string(),
      positionId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Note: A user can only have one primary position at a time.
      const [updatedUser] = await ctx.db
        .update(user)
        .set({ positionId: input.positionId })
        .where(eq(user.id, input.userId))
        .returning();
      
      if (!updatedUser) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      return updatedUser;
    }),

  removeUserFromPosition: protectedAdminProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [updatedUser] = await ctx.db
        .update(user)
        .set({ positionId: null })
        .where(eq(user.id, input.userId))
        .returning();
      
      if (!updatedUser) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      return updatedUser;
    }),

  // ---- POSITIONS & HIERARCHY ----
  getPositions: protectedAdminProcedure
    .query(async ({ ctx }) => {
      const positions = await ctx.db
        .select()
        .from(orgPositions)
        .orderBy(sql`${orgPositions.hierarchyPath} ASC`);
      return positions;
    }),

  createPosition: protectedAdminProcedure
    .input(z.object({
      code: z.string(),
      title: z.string(),
      parentId: z.string().uuid().optional().nullable(),
      isSigner: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      // Create new position and compute its ltree path.
      // This requires executing a raw query or updating it after insert.
      return await ctx.db.transaction(async (tx) => {
        let parentPath = "";
        
        if (input.parentId) {
          const [parent] = await tx.select().from(orgPositions).where(eq(orgPositions.id, input.parentId));
          if (!parent) throw new TRPCError({ code: "NOT_FOUND", message: "Parent position not found" });
          parentPath = parent.hierarchyPath as unknown as string; // LTree string
        }

        const [newPos] = await tx.insert(orgPositions).values({
          code: input.code,
          title: input.title,
          parentId: input.parentId || null,
          isSigner: input.isSigner,
          hierarchyPath: sql`'temp'` // placeholder
        }).returning();

        // Calculate and update the proper ltree path
        // ltree paths cannot have hyphens (UUIDs have hyphens). We convert hyphens to underscores.
        const safeId = newPos.id.replace(/-/g, '_');
        const finalPath = parentPath ? `${parentPath}.${safeId}` : safeId;

        const [updatedPos] = await tx.update(orgPositions)
          .set({ hierarchyPath: sql`${finalPath}::ltree` })
          .where(eq(orgPositions.id, newPos.id))
          .returning();

        return updatedPos;
      });
    }),

  updatePositionParent: protectedAdminProcedure
    .input(z.object({
      positionId: z.string().uuid(),
      newParentId: z.string().uuid().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Moving a node in ltree means we must update its path AND all descendants' paths.
      // Easiest approach in Postgres: 
      // UPDATE org_positions SET hierarchy_path = new_path || subpath(hierarchy_path, nlevel(old_path))
      // WHERE hierarchy_path <@ old_path
      
      const [pos] = await ctx.db.select().from(orgPositions).where(eq(orgPositions.id, input.positionId));
      if (!pos) throw new TRPCError({ code: "NOT_FOUND" });

      const oldPath = pos.hierarchyPath;
      
      let newParentPath = "";
      if (input.newParentId) {
        const [parent] = await ctx.db.select().from(orgPositions).where(eq(orgPositions.id, input.newParentId));
        if (!parent) throw new TRPCError({ code: "NOT_FOUND", message: "Parent not found" });
        newParentPath = parent.hierarchyPath as unknown as string;
      }

      const safeId = pos.id.replace(/-/g, '_');
      const newPath = newParentPath ? `${newParentPath}.${safeId}` : safeId;

      // Update the node itself
      await ctx.db.execute(sql`
        UPDATE org_positions 
        SET parent_id = ${input.newParentId || null},
            hierarchy_path = ${newPath}::ltree
        WHERE id = ${input.positionId}
      `);

      // Update all descendants
      await ctx.db.execute(sql`
        UPDATE org_positions 
        SET hierarchy_path = ${newPath}::ltree || subpath(hierarchy_path, nlevel(${oldPath}::ltree))
        WHERE hierarchy_path <@ ${oldPath}::ltree AND id != ${input.positionId}
      `);

      return { success: true };
    }),

  updatePosition: protectedAdminProcedure
    .input(z.object({
      id: z.string().uuid(),
      code: z.string(),
      title: z.string(),
      isSigner: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const [updatedPos] = await ctx.db.update(orgPositions)
        .set({
          code: input.code,
          title: input.title,
          isSigner: input.isSigner,
        })
        .where(eq(orgPositions.id, input.id))
        .returning();
      if (!updatedPos) throw new TRPCError({ code: "NOT_FOUND", message: "Position not found" });
      return updatedPos;
    }),

  deletePosition: protectedAdminProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check for subordinates
      const children = await ctx.db.select({ id: orgPositions.id }).from(orgPositions).where(eq(orgPositions.parentId, input.id)).limit(1);
      if (children.length > 0) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Tidak dapat menghapus posisi yang memiliki bawahan." });
      }

      // Check for assigned users
      const users = await ctx.db.select({ id: user.id }).from(user).where(eq(user.positionId, input.id)).limit(1);
      if (users.length > 0) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Tidak dapat menghapus posisi yang masih memiliki user aktif." });
      }

      const [deleted] = await ctx.db.delete(orgPositions).where(eq(orgPositions.id, input.id)).returning();
      if (!deleted) throw new TRPCError({ code: "NOT_FOUND", message: "Position not found" });
      return { success: true };
    }),

  // ---- ACTIVITY LOGS ----
  getActivityLogs: protectedAdminProcedure
    .query(async ({ ctx }) => {
      const logs = await ctx.db.select({
        id: documentAuditTrails.id,
        eventType: documentAuditTrails.eventType,
        createdAt: documentAuditTrails.createdAt,
        actorName: user.name,
        actorEmail: user.email,
        documentSubject: documents.subject,
      })
      .from(documentAuditTrails)
      .leftJoin(user, eq(documentAuditTrails.actorUserId, user.id))
      .leftJoin(documents, eq(documentAuditTrails.documentId, documents.id))
      .orderBy(desc(documentAuditTrails.createdAt));
      
      return logs;
    }),

  // ---- MAIL FLOW ----
  getGlobalMailFlow: protectedAdminProcedure
    .query(async ({ ctx }) => {
      const flows = await ctx.db.select({
        id: documents.id,
        documentNumber: documents.documentNumber,
        subject: documents.subject,
        currentStatus: documents.currentStatus,
        classificationCode: documents.classificationCode,
        urgencyLevel: documents.urgencyLevel,
        senderPosition: orgPositions.title,
        createdAt: documents.createdAt,
      })
      .from(documents)
      .leftJoin(orgPositions, eq(documents.senderPositionId, orgPositions.id))
      .orderBy(desc(documents.createdAt));
      
      return flows;
    }),

  // ---- SYSTEM SETTINGS ----
  getSettings: protectedAdminProcedure
    .query(async ({ ctx }) => {
      const settings = await ctx.db.select().from(systemSettings);
      return settings;
    }),
    
  updateSetting: protectedAdminProcedure
    .input(z.object({
      key: z.string(),
      value: z.any(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [setting] = await ctx.db.insert(systemSettings).values({
        key: input.key,
        value: input.value,
        description: input.description,
        updatedBy: ctx.session.userId,
      }).onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value: input.value,
          description: input.description,
          updatedBy: ctx.session.userId,
          updatedAt: new Date(),
        }
      }).returning();
      return setting;
    }),
});

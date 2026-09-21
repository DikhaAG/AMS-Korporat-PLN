import { initTRPC, TRPCError } from "@trpc/server";
import { headers } from "next/headers";
import superjson from "superjson";
import { ZodError } from "zod";
import { db } from "@/db";
import { auth } from "@/lib/auth";

export interface TRPCContext {
  db: typeof db;
  headers: Headers;
  session: typeof auth.$Infer.Session["session"] | null;
  user: typeof auth.$Infer.Session["user"] | null;
}

export const createTRPCContext = async (): Promise<TRPCContext> => {
  const headersList = await headers();
  const sessionData = await auth.api.getSession({ headers: headersList });
  
  return { 
    db, 
    headers: headersList,
    session: sessionData?.session || null,
    user: sessionData?.user || null
  };
};

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: ctx.session,
      user: ctx.user,
    },
  });
});

export const protectedPositionProcedure = protectedProcedure.use(({ ctx, next }) => {
  // In a real implementation, we'd verify activePositionId from custom session context for PLH/PLT
  // For now, we enforce that the user has a positionId assigned.
  if (!ctx.user.positionId) {
    throw new TRPCError({ 
      code: "FORBIDDEN", 
      message: "No structural position assigned." 
    });
  }
  return next({
    ctx: {
      activePositionId: ctx.user.positionId,
    },
  });
});

export const protectedAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ 
      code: "FORBIDDEN", 
      message: "Admin privileges required." 
    });
  }
  return next({
    ctx: {
      ...ctx,
    },
  });
});

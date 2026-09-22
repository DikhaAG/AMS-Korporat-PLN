import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { createTRPCRouter } from '../trpc';
import { documentRouter } from './document';
import { dispositionRouter } from './disposition';
import { adminRouter } from './admin';
import { userRouter } from './user';

export const appRouter = createTRPCRouter({
  document: documentRouter,
  disposition: dispositionRouter,
  admin: adminRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

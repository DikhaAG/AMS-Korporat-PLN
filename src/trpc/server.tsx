import "server-only";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { cache } from "react";
import superjson from "superjson";
import { createTRPCContext, createCallerFactory } from "@/server/trpc";
import { appRouter, type AppRouter } from "@/server/routers/_app";
import { makeQueryClient } from "./query-client";

export const getQueryClient = cache(makeQueryClient);

const createCaller = createCallerFactory(appRouter);

export const getCaller = cache(async () => {
  const ctx = await createTRPCContext();
  return createCaller(ctx);
});

function getBaseUrl() {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const trpc = createTRPCOptionsProxy<AppRouter>({
  queryClient: getQueryClient,
  client: createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
        transformer: superjson,
      }),
    ],
  }),
});

export function prefetch<T>(queryOptions: T) {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(queryOptions as Parameters<typeof queryClient.prefetchQuery>[0]);
}

export function HydrateClient({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>;
}

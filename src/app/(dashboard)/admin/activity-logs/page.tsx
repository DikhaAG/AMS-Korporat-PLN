"use client";

import { Suspense } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";

function ActivityLogsContent() {
  const trpc = useTRPC();
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  // Note: we can add more filters to the TRPC route later (e.g., eventType, date range).

  const { data, isLoading } = useQuery({
    ...trpc.admin.getActivityLogs.queryOptions(),
    staleTime: 30000,
  });

  // Calculate pagination locally since the endpoint returns all currently.
  // Ideally, pagination should be handled server-side via TRPC input in a real production scale.
  const PAGE_SIZE = 10;
  const safeData = data || [];
  const pageCount = Math.ceil(safeData.length / PAGE_SIZE);
  const paginatedData = safeData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-emerald-600">
          <Activity className="w-6 h-6" />
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Log Aktivitas</h2>
        </div>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Tinjau jejak audit semua aktivitas pengguna dalam sistem, dari pembuatan dokumen, delegasi, hingga persetujuan.
        </p>
      </div>

      <div className="glass-panel p-1 border-emerald-500/10">
        <DataTable
          columns={columns}
          data={paginatedData}
          page={page}
          pageCount={pageCount}
          onPageChange={setPage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

export default function ActivityLogsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 space-y-8 p-8 pt-6">
          <Skeleton className="h-10 w-64 rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      }
    >
      <ActivityLogsContent />
    </Suspense>
  );
}

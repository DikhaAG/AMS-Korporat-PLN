"use client"

import { Network } from "lucide-react"
import { useTRPC } from "@/trpc/client"
import { useQuery } from "@tanstack/react-query"
import { OrgChartEditor } from "@/components/admin/org-chart-editor"

export default function PositionsAdminPage() {
  const trpc = useTRPC()
  const { data: positions, isLoading, error } = useQuery(trpc.admin.getPositions.queryOptions())

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] w-full max-w-[1600px] mx-auto pb-6">
      <div className="mb-6 shrink-0">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-4">
          <Network className="w-8 h-8 text-destructive" />
          Struktur Posisi (Organisasi)
        </h1>
        <p className="text-muted-foreground mt-2 text-sm max-w-xl">
          Visualisasi drag-and-drop editor untuk manajemen hierarki jabatan (ltree). Tarik garis antar node untuk mengubah struktur induk.
        </p>
      </div>

      <div className="flex-1 w-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-3xl rounded-[2rem] border border-black/5 dark:border-white/10 shadow-ambient p-4 relative overflow-hidden">
        {isLoading ? (
          <div className="animate-pulse space-y-4 p-4">
            <div className="h-12 bg-muted rounded-xl w-full" />
            <div className="h-12 bg-muted rounded-xl w-3/4 ml-8" />
            <div className="h-12 bg-muted rounded-xl w-1/2 ml-16" />
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-destructive/5 text-destructive border border-destructive/20 shadow-sm mt-4 text-center font-medium">
            Gagal memuat posisi: {error.message}
          </div>
        ) : (
          <OrgChartEditor items={positions || []} />
        )}
      </div>
    </div>
  )
}

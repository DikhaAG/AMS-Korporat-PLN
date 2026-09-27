"use client"

import { Suspense, useMemo } from "react"
import { createColumns, Document } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { InboxFilters } from "@/components/inbox/inbox-filters"
import { DocumentPreviewSheet } from "@/components/inbox/document-preview-sheet"
import { useTRPC } from "@/trpc/client"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"
import { useQueryState, parseAsInteger, parseAsString } from "nuqs"

function InboxContent() {
  const trpc = useTRPC()
  
  // URL States via nuqs
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1))
  const [search] = useQueryState('search', parseAsString.withDefault(''))
  const [status] = useQueryState('status', parseAsString)
  const [previewId, setPreviewId] = useQueryState('previewId', parseAsString)

  const queryOptions = {
    page,
    limit: 10,
    type: "INBOX" as const,
    ...(search ? { search } : {}),
    ...(status ? { status: status as any } : {}),
  };

  const { data, isLoading, error } = useQuery(trpc.document.getDocuments.queryOptions(queryOptions))

  const handleOpenPreview = (docOrId: Document | string) => {
    const id = typeof docOrId === "string" ? docOrId : docOrId.id
    setPreviewId(id)
  }

  const tableColumns = useMemo(() => {
    return createColumns((doc) => handleOpenPreview(doc))
  }, [])

  return (
    <div className="flex flex-col h-full bg-transparent w-full max-w-[1600px] mx-auto">
      <div className="flex-1 overflow-auto py-8 lg:py-12 px-2">
        
        {/* Vanguard Toolbar */}
        <div className="mb-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-4">
              Inbox Nota Dinas
              <span className="bg-[#145f74]/10 text-[#145f74] text-sm px-3 py-1 rounded-full font-bold">
                {data?.totalCount || 0} Naskah
              </span>
            </h1>
            <p className="text-muted-foreground mt-2 text-sm max-w-xl">
              Pusat penerimaan naskah dinas. Klik naskah untuk pratinjau cepat (Slide-Over Drawer) dan persetujuan / paraf langsung.
            </p>
          </div>
        </div>

        <InboxFilters />

        {/* Table Area */}
        {error ? (
          <div className="p-6 rounded-2xl bg-destructive/5 text-destructive border border-destructive/20 shadow-sm mt-4 text-center font-medium">
            Error loading documents: {error.message}
          </div>
        ) : (
          <div className="w-full">
            <DataTable 
              columns={tableColumns} 
              data={data?.items as any || []} 
              isLoading={isLoading}
              page={page}
              pageCount={data?.pageCount || 1}
              onPageChange={setPage}
              onRowClick={(row: any) => handleOpenPreview(row)}
            />
          </div>
        )}
      </div>

      {/* Slide-Over Quick Drawer Preview */}
      <DocumentPreviewSheet
        documentId={previewId}
        open={Boolean(previewId)}
        onOpenChange={(open) => {
          if (!open) setPreviewId(null)
        }}
      />
    </div>
  )
}

export default function InboxPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col h-full bg-transparent w-full max-w-[1600px] mx-auto p-8 space-y-6">
          <Skeleton className="h-12 w-64 rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      }
    >
      <InboxContent />
    </Suspense>
  )
}

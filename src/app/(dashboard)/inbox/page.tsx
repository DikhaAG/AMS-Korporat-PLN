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
  const [docType] = useQueryState('docType', parseAsString)
  const [view] = useQueryState('view', parseAsString.withDefault('inbox'))
  const [type] = useQueryState('type', parseAsString.withDefault('INBOX'))
  const [previewId, setPreviewId] = useQueryState('previewId', parseAsString)

  const queryOptions = {
    page,
    limit: 10,
    type: (type as any) || "INBOX",
    view: view || undefined,
    ...(docType ? { documentType: docType as any } : {}),
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

  // Dynamic Header Presentation based on active view and document type
  const headerInfo = useMemo(() => {
    if (view === "dispositions-sent" || type === "DISPOSITIONS_SENT") {
      return {
        title: "Surat Masuk: Terkirim",
        subtitle: "Riwayat tindak lanjut dan delegasi disposisi yang telah Anda teruskan ke bawahan.",
        badge: "Disposisi Saya",
      }
    }
    if (docType === "OUTGOING_LETTER") {
      if (view === "persetujuan") {
        return {
          title: "Surat Keluar: Persetujuan",
          subtitle: "Antrean surat keluar yang menunggu pemeriksaan paraf atau penandatanganan elektronik (TTE) Anda.",
          badge: "Butuh Paraf/TTE",
        }
      }
      if (view === "konsep") {
        return {
          title: "Surat Keluar: Konsep",
          subtitle: "Konsep draf surat keluar yang sedang dirancang atau memerlukan perbaikan revisi.",
          badge: "Draf Konsep",
        }
      }
      if (view === "terkirim") {
        return {
          title: "Surat Keluar: Terkirim",
          subtitle: "Arsip surat keluar resmi yang telah disahkan (TTE) dan terbit ber-Nomor.",
          badge: "Sah & Terbit",
        }
      }
      if (view === "dibatalkan") {
        return {
          title: "Surat Keluar: Dibatalkan",
          subtitle: "Arsip surat keluar yang ditolak atau dibatalkan oleh pihak pembuat.",
          badge: "Ditolak / Batal",
        }
      }
      return {
        title: "Surat Keluar: Telusuri Arsip",
        subtitle: "Pencarian dan pemantauan menyeluruh seluruh arsip surat keluar unit kerja.",
        badge: "Arsip Lengkap",
      }
    }

    if (docType === "DINAS_NOTE") {
      if (view === "persetujuan") {
        return {
          title: "Nota Dinas: Persetujuan",
          subtitle: "Antrean nota dinas internal yang menunggu pemeriksaan paraf atau pengesahan TTE Anda.",
          badge: "Butuh Paraf/TTE",
        }
      }
      if (view === "konsep") {
        return {
          title: "Nota Dinas: Konsep",
          subtitle: "Konsep draf nota dinas internal yang sedang dirancang tim Anda.",
          badge: "Draf Konsep",
        }
      }
      if (view === "terkirim") {
        return {
          title: "Nota Dinas: Terkirim",
          subtitle: "Nota dinas internal yang telah disahkan dan terdistribusi ke unit penerima.",
          badge: "Sah & Terbit",
        }
      }
      if (view === "dibatalkan") {
        return {
          title: "Nota Dinas: Dibatalkan",
          subtitle: "Arsip nota dinas internal yang ditolak atau dibatalkan.",
          badge: "Ditolak / Batal",
        }
      }
      if (view === "telusuri") {
        return {
          title: "Nota Dinas: Telusuri Arsip",
          subtitle: "Pencarian dan pemantauan seluruh arsip nota dinas internal.",
          badge: "Arsip Lengkap",
        }
      }
      return {
        title: "Nota Dinas Masuk",
        subtitle: "Kotak penerimaan nota dinas internal dari unit/bidang kerja lain.",
        badge: "Internal PLN",
      }
    }

    if (docType === "CIRCULAR_LETTER" || view?.startsWith("gabungan")) {
      return {
        title: "Naskah Dinas Gabungan",
        subtitle: "Paket persuratan dinas gabungan, surat edaran, dan surat penugasan terpadu.",
        badge: "Naskah Gabungan",
      }
    }

    return {
      title: "Inbox Nota Dinas & Surat Masuk",
      subtitle: "Pusat penerimaan naskah dinas korporat. Klik baris naskah untuk pratinjau cepat (Slide-Over Drawer) dan persetujuan / paraf langsung.",
      badge: `${data?.totalCount || 0} Naskah`,
    }
  }, [view, docType, type, data?.totalCount])

  return (
    <div className="flex flex-col h-full bg-transparent w-full max-w-[1600px] mx-auto">
      <div className="flex-1 overflow-auto py-8 lg:py-12 px-2">
        
        {/* Vanguard Toolbar */}
        <div className="mb-8 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground">
                {headerInfo.title}
              </h1>
              <span className="bg-[#145f74]/10 text-[#145f74] dark:bg-[#145f74]/30 dark:text-cyan-300 text-xs px-3 py-1 rounded-full font-bold">
                {headerInfo.badge}
              </span>
            </div>
            <p className="text-muted-foreground mt-1.5 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {headerInfo.subtitle}
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

"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/client"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { DocumentReviewCard } from "@/components/document/document-review-card"
import { DispositionForm } from "@/components/disposition/disposition-form"
import {
  ExternalLink,
  Copy,
  Check,
  FileText,
  Paperclip,
  QrCode,
  Download,
  AlertCircle,
  Info,
  ShieldCheck,
  PenTool,
  Clock,
  ArrowRight,
  Sparkles
} from "lucide-react"
import { toast } from "sonner"

interface DocumentPreviewSheetProps {
  documentId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DocumentPreviewSheet({
  documentId,
  open,
  onOpenChange,
}: DocumentPreviewSheetProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const { data: document, isLoading, error } = useQuery(
    trpc.document.getDocument.queryOptions(
      { id: documentId || "" },
      { enabled: !!documentId && open }
    )
  )

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    toast.success("Berhasil Disalin", { description: text })
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleActionSuccess = () => {
    queryClient.invalidateQueries({ queryKey: [["document"]] })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-3xl lg:max-w-4xl p-0 flex flex-col bg-background/95 backdrop-blur-2xl border-l border-border/60 shadow-2xl overflow-hidden data-[side=right]:sm:max-w-3xl data-[side=right]:lg:max-w-4xl"
      >
        {/* Drawer Header */}
        <div className="bg-[#145f74] text-white p-6 pb-5 flex flex-col gap-3 relative shrink-0 shadow-md">
          <div className="flex items-center justify-between pr-10">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-white/15 px-2.5 py-1 rounded-md text-white/90">
                {document?.documentType === "OUTGOING_LETTER" ? "Surat Keluar" : "Nota Dinas"}
              </span>
              {document && (
                <Badge
                  variant="outline"
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${
                    document.currentStatus === "SIGNED_AND_PUBLISHED"
                      ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/40"
                      : document.currentStatus === "IN_REVIEW"
                      ? "bg-sky-500/20 text-sky-200 border-sky-400/40"
                      : document.currentStatus === "NEEDS_REVISION"
                      ? "bg-amber-500/20 text-amber-200 border-amber-400/40"
                      : "bg-white/10 text-white/80 border-white/20"
                  }`}
                >
                  {document.currentStatus}
                </Badge>
              )}
            </div>

            {documentId && (
              <Link
                href={`/document/${documentId}`}
                target="_blank"
                className="text-xs font-semibold text-white/90 hover:text-white flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
                title="Buka naskah di tab penuh"
              >
                <span>Halaman Penuh</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          <div>
            <SheetTitle render={<div />} className="text-white text-lg font-bold line-clamp-2 leading-snug">
              {isLoading ? (
                <Skeleton className="h-6 w-3/4 bg-white/20 rounded-md" />
              ) : (
                document?.subject || "Pratinjau Naskah Dinas"
              )}
            </SheetTitle>
            <SheetDescription render={<div />} className="text-white/70 text-xs mt-1 font-mono">
              {isLoading ? (
                <Skeleton className="h-4 w-1/2 bg-white/20 rounded-md mt-1" />
              ) : (
                document?.documentNumber ? `No: ${document.documentNumber}` : "DRAFT (Belum Bernomor)"
              )}
            </SheetDescription>
          </div>
        </div>

        {/* Drawer Body Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading && (
            <div className="space-y-4 py-6">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 p-6 rounded-2xl text-center space-y-3 my-8">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
              <h4 className="font-bold text-sm text-foreground">Gagal Memuat Naskah</h4>
              <p className="text-xs text-muted-foreground">{error.message}</p>
            </div>
          )}

          {!isLoading && document && (
            <>
              {/* Metadata Overview Card */}
              <div className="bg-muted/15 rounded-2xl border border-border/60 p-4 sm:p-5 text-xs space-y-2.5 shadow-sm">
                <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[140px_1fr] gap-2 items-baseline">
                  <span className="font-bold text-muted-foreground">Pengirim (Dari)</span>
                  <span className="font-semibold text-foreground">
                    : {document.senderPosition?.title || "System / Drafter"} {document.senderPosition?.code ? `(${document.senderPosition.code})` : ""}
                  </span>
                </div>

                <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[140px_1fr] gap-2 items-start">
                  <span className="font-bold text-muted-foreground">Tujuan (Kepada)</span>
                  <div className="space-y-0.5">
                    {document.recipients && document.recipients.length > 0 ? (
                      document.recipients.map((rec, idx) => (
                        <div key={rec.id} className="text-foreground">
                          {idx === 0 ? ": " : "  "}{idx + 1}. {rec.position?.title || "Penerima"} {rec.position?.code ? `(${rec.position.code})` : ""}
                        </div>
                      ))
                    ) : (
                      <span className="text-muted-foreground">: -</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[140px_1fr] gap-2 items-baseline">
                  <span className="font-bold text-muted-foreground">Tanggal Naskah</span>
                  <span className="text-foreground">
                    : {new Date(document.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>

                <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[140px_1fr] gap-2 items-baseline">
                  <span className="font-bold text-muted-foreground">Nomor Naskah</span>
                  <div className="flex items-center gap-2 font-mono text-[#145f74] font-bold">
                    : {document.documentNumber || "DRAFT"}
                    {document.documentNumber && (
                      <button
                        onClick={() => copyToClipboard(document.documentNumber || "", "num")}
                        className="p-1 hover:bg-muted/50 rounded text-muted-foreground transition-colors"
                        title="Salin Nomor"
                      >
                        {copiedField === "num" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>

                {document.currentStatus === "SIGNED_AND_PUBLISHED" && (
                  <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[140px_1fr] gap-2 items-baseline">
                    <span className="font-bold text-muted-foreground">Pengesahan</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      : <QrCode className="w-3.5 h-3.5" /> TTE (Tanda Tangan Elektronik Sah)
                    </span>
                  </div>
                )}
              </div>

              {/* Action Area: Review or Disposition */}
              {document.canReview && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#145f74]">
                    <Sparkles className="w-4 h-4" />
                    <span>Aksi Persetujuan & Paraf Diperlukan:</span>
                  </div>
                  <DocumentReviewCard
                    documentId={document.id}
                    isSigner={document.isSigner}
                    onSuccess={handleActionSuccess}
                  />
                </div>
              )}

              {document.canDisposition && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#145f74]">
                    <ArrowRight className="w-4 h-4" />
                    <span>Tindak Lanjut & Disposisi:</span>
                  </div>
                  <DispositionForm
                    documentId={document.id}
                    onSuccess={handleActionSuccess}
                  />
                </div>
              )}

              {/* Tabs: Isi Naskah, Pemeriksaan & Paraf, Riwayat Disposisi */}
              <Tabs defaultValue="isi" className="w-full">
                <TabsList className="bg-muted/30 border border-border/50 rounded-xl h-11 p-1 grid grid-cols-3 w-full">
                  <TabsTrigger value="isi" className="text-xs font-bold data-[state=active]:bg-[#145f74] data-[state=active]:text-white rounded-lg">
                    Isi Naskah
                  </TabsTrigger>
                  <TabsTrigger value="paraf" className="text-xs font-bold data-[state=active]:bg-[#145f74] data-[state=active]:text-white rounded-lg">
                    Rantai Paraf ({document.approvals?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="disposisi" className="text-xs font-bold data-[state=active]:bg-[#145f74] data-[state=active]:text-white rounded-lg">
                    Disposisi ({document.dispositions?.length || 0})
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Isi Naskah HTML Content */}
                <TabsContent value="isi" className="mt-4 space-y-4">
                  <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-border/60 p-6 shadow-sm">
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none font-serif leading-relaxed text-foreground"
                      dangerouslySetInnerHTML={{ __html: document.bodyHtml }}
                    />
                  </div>

                  {/* Attachment Box */}
                  <div className="p-4 bg-muted/10 rounded-2xl border border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#145f74]/10 text-[#145f74] flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-foreground block">
                          Lampiran Naskah Dinas ({document.documentNumber ? document.documentNumber.replace(/\//g, "_") : "Dokumen"}.pdf)
                        </span>
                        <span className="text-[10px] text-muted-foreground">PDF Document Resmi PT PLN (Persero)</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toast.info("Mengunduh Lampiran Dokumen...")}
                      className="text-xs rounded-xl font-medium gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Unduh
                    </Button>
                  </div>
                </TabsContent>

                {/* Tab 2: Pemeriksaan & Rantai Paraf */}
                <TabsContent value="paraf" className="mt-4 space-y-3">
                  {document.approvals && document.approvals.length > 0 ? (
                    <div className="space-y-3">
                      {document.approvals.map((app, idx) => (
                        <div
                          key={app.id}
                          className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-border/50 shadow-sm flex items-start justify-between gap-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                              {idx + 1}
                            </div>
                            <div className="space-y-1">
                              <span className="font-bold text-xs text-foreground block">
                                {app.reviewerPosition?.title || "Posisi Verifikator"}
                              </span>
                              <p className="text-[11px] text-muted-foreground">
                                Peran: <strong className="text-foreground/80">{app.approvalRole}</strong>
                              </p>
                              {app.notes && (
                                <p className="text-xs bg-muted/20 p-2.5 rounded-xl border border-border/40 text-foreground italic mt-2">
                                  "{app.notes}"
                                </p>
                              )}
                              {app.actedAt && (
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                                  <Clock className="w-3 h-3" />
                                  Diproses: {new Date(app.actedAt).toLocaleString("id-ID")}
                                </p>
                              )}
                            </div>
                          </div>

                          <Badge
                            variant="outline"
                            className={`text-xs font-bold shrink-0 ${
                              app.actionStatus === "APPROVED"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                : app.actionStatus === "REJECTED"
                                ? "bg-destructive/10 text-destructive border-destructive/30"
                                : app.actionStatus === "REVISED"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {app.actionStatus}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-xs text-muted-foreground bg-muted/10 rounded-2xl border border-border/40">
                      Belum ada catatan paraf verifikator pada naskah ini.
                    </div>
                  )}
                </TabsContent>

                {/* Tab 3: Riwayat Disposisi */}
                <TabsContent value="disposisi" className="mt-4 space-y-3">
                  {document.dispositions && document.dispositions.length > 0 ? (
                    <div className="space-y-3">
                      {document.dispositions.map((disp: any, idx: number) => (
                        <div
                          key={disp.id}
                          className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-border/50 shadow-sm space-y-2.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-foreground">
                              {disp.fromPosition?.title || "Pemberi"} → {disp.toPosition?.title || "Penerima"}
                            </span>
                            <Badge variant="outline" className="text-[10px] font-bold">
                              {disp.transmissionMode}
                            </Badge>
                          </div>

                          {disp.actionChecklist && disp.actionChecklist.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {disp.actionChecklist.map((item: string, i: number) => (
                                <span
                                  key={i}
                                  className="bg-[#145f74]/10 text-[#145f74] px-2 py-0.5 rounded text-[10px] font-semibold"
                                >
                                  ✓ {item}
                                </span>
                              ))}
                            </div>
                          )}

                          {disp.instructionNotes && (
                            <p className="text-xs bg-muted/20 p-2.5 rounded-xl border border-border/40 text-foreground italic">
                              "{disp.instructionNotes}"
                            </p>
                          )}

                          <span className="text-[10px] text-muted-foreground block text-right">
                            {new Date(disp.createdAt).toLocaleString("id-ID")}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-xs text-muted-foreground bg-muted/10 rounded-2xl border border-border/40">
                      Belum ada riwayat disposisi untuk naskah dinas ini.
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

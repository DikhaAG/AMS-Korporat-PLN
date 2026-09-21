"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DispositionForm } from "@/components/disposition/disposition-form"
import { DocumentReviewCard } from "@/components/document/document-review-card"
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  FileText, 
  Paperclip, 
  ShieldCheck, 
  QrCode, 
  History, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Download,
  Info
} from "lucide-react"

export default function DocumentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const trpc = useTRPC()
  const documentId = params.id as string
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const { data: document, isLoading, error } = useQuery(
    trpc.document.getDocument.queryOptions({ id: documentId })
  )

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#145f74] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Memuat Data Naskah Dinas...</p>
        </div>
      </div>
    )
  }

  if (error || !document) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-destructive/5 border border-destructive/20 p-8 rounded-3xl max-w-md text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
          <h3 className="font-bold text-lg text-foreground">Gagal Memuat Dokumen</h3>
          <p className="text-sm text-muted-foreground">{error?.message || "Naskah tidak ditemukan."}</p>
          <Button onClick={() => router.push("/inbox")} variant="outline" className="rounded-xl">
            Kembali ke Inbox
          </Button>
        </div>
      </div>
    )
  }

  const docDate = new Date(document.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  })

  const receivedDate = new Date(document.updatedAt || document.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })

  const activeRetention = document.retentionActiveDate 
    ? new Date(document.retentionActiveDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "-"

  const inactiveRetention = document.retentionInactiveDate 
    ? new Date(document.retentionInactiveDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "-"

  const isSigned = document.currentStatus === "SIGNED_AND_PUBLISHED"

  return (
    <div className="flex flex-col h-full bg-transparent w-full max-w-[1600px] mx-auto pb-16 px-2 sm:px-4 space-y-6">
      
      {/* Benchmark Top Header: <- kembali & Copy Nomor (Untuk PLH) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2 border-b border-border/40">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/inbox")}
            className="flex items-center gap-1.5 font-bold text-xs text-muted-foreground hover:text-foreground rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            kembali
          </Button>
          <div className="h-4 w-px bg-border/60" />
          <span className="font-extrabold text-sm text-foreground tracking-tight">
            {document.documentType === "OUTGOING_LETTER" ? "Surat Keluar" : "Nota Dinas"}
          </span>
          <Badge 
            variant="outline" 
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              isSigned 
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" 
                : document.currentStatus === "IN_REVIEW"
                ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                : document.currentStatus === "NEEDS_REVISION"
                ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {document.currentStatus}
          </Badge>
        </div>

        {/* Quick Action Tools */}
        <div className="flex items-center gap-2">
          {document.documentNumber && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(document.documentNumber || "", "plh")}
              className="text-xs font-medium rounded-xl border-border/60 hover:bg-muted/30 flex items-center gap-1.5"
            >
              {copiedField === "plh" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              Copy Nomor (Untuk PLH)
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs font-medium rounded-xl border-border/60 hover:bg-muted/30 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Cetak / PDF
          </Button>
        </div>
      </div>

      {/* DUAL PANE SPLIT (Matching Image 5 Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6 xl:gap-8 items-start">
        
        {/* ================= LEFT PANEL: DATA SURAT ================= */}
        <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] border border-border/60 shadow-ambient flex flex-col overflow-hidden">
          
          {/* Header Bar */}
          <div className="bg-[#145f74] text-white px-6 py-3.5 flex items-center justify-between">
            <h2 className="font-bold text-sm tracking-wide">Data Surat</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(document.subject, "surat")}
              className="text-white hover:bg-white/10 text-xs font-medium h-8 rounded-lg flex items-center gap-1.5"
            >
              {copiedField === "surat" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              Copy Surat
            </Button>
          </div>

          {/* Key-Value Metadata Grid (Matching Image 5 Benchmark Table) */}
          <div className="p-6 space-y-3.5 text-xs text-foreground/90 border-b border-border/40 bg-white dark:bg-neutral-900">
            <div className="grid grid-cols-[140px_1fr] gap-2 items-baseline">
              <span className="font-bold text-foreground">No Agenda</span>
              <span className="font-mono text-muted-foreground">: {document.agendaNumber || "-"}</span>
            </div>

            <div className="grid grid-cols-[140px_1fr] gap-2 items-baseline">
              <span className="font-bold text-foreground">Tanggal Terima</span>
              <span className="text-muted-foreground">: {receivedDate}</span>
            </div>

            <div className="grid grid-cols-[140px_1fr] gap-2 items-baseline">
              <span className="font-bold text-foreground">Nomor Surat</span>
              <div className="flex items-center gap-1.5 font-mono text-[#145f74] font-bold">
                : {document.documentNumber || "DRAFT (Belum Bernomor)"}
                {document.documentNumber && (
                  <button 
                    onClick={() => copyToClipboard(document.documentNumber || "", "num")}
                    className="p-1 hover:bg-muted/40 rounded text-muted-foreground"
                    title="Salin Nomor Surat"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-[140px_1fr] gap-2 items-baseline">
              <span className="font-bold text-foreground">Pengesahan</span>
              <div className="flex items-center gap-1.5">
                : {isSigned ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                    <QrCode className="w-3.5 h-3.5" />
                    TTE (Digital Signature Resmi PLN)
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-[140px_1fr] gap-2 items-baseline">
              <span className="font-bold text-foreground">Tanggal Surat</span>
              <span className="text-muted-foreground">: {docDate}</span>
            </div>

            <div className="grid grid-cols-[140px_1fr] gap-2 items-baseline">
              <span className="font-bold text-foreground">Rentang Waktu Aktif</span>
              <span className="text-muted-foreground">: {docDate} s/d {activeRetention}</span>
            </div>

            <div className="grid grid-cols-[140px_1fr] gap-2 items-baseline">
              <span className="font-bold text-foreground">Rentang Waktu Inaktif</span>
              <span className="text-muted-foreground">: {activeRetention} s/d {inactiveRetention}</span>
            </div>

            <div className="grid grid-cols-[140px_1fr] gap-2 items-baseline">
              <span className="font-bold text-foreground">Hal</span>
              <span className="font-bold text-foreground leading-relaxed">: {document.subject}</span>
            </div>

            <div className="grid grid-cols-[140px_1fr] gap-2 items-baseline">
              <span className="font-bold text-foreground">Dari</span>
              <span className="font-semibold text-foreground">
                : {document.senderPosition?.title || "System / Drafter"} {document.senderPosition?.code ? `(${document.senderPosition.code})` : ""}
              </span>
            </div>

            <div className="grid grid-cols-[140px_1fr] gap-2 items-start">
              <span className="font-bold text-foreground">Kepada</span>
              <div className="space-y-1">
                {document.recipients && document.recipients.length > 0 ? (
                  document.recipients.map((rec, idx) => (
                    <div key={rec.id} className="text-foreground">
                      {idx === 0 ? ": " : "  "}{idx + 1}. {rec.position?.title || "Posisi Penerima"} {rec.position?.code ? `(${rec.position.code})` : ""}
                    </div>
                  ))
                ) : (
                  <span className="text-muted-foreground">: -</span>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Tabs: Isi Naskah, Attachment/Lampiran, Referensi (Image 5 Benchmark) */}
          <div className="p-4 flex-1">
            <Tabs defaultValue="isi" className="w-full flex flex-col h-full">
              <TabsList className="bg-[#145f74]/10 border border-[#145f74]/20 rounded-xl h-10 p-1 grid grid-cols-3 w-full">
                <TabsTrigger value="isi" className="text-xs font-bold data-[state=active]:bg-[#145f74] data-[state=active]:text-white rounded-lg">
                  Isi Naskah
                </TabsTrigger>
                <TabsTrigger value="attachment" className="text-xs font-bold data-[state=active]:bg-[#145f74] data-[state=active]:text-white rounded-lg flex items-center gap-1">
                  <Paperclip className="w-3 h-3" />
                  Lampiran
                </TabsTrigger>
                <TabsTrigger value="paraf" className="text-xs font-bold data-[state=active]:bg-[#145f74] data-[state=active]:text-white rounded-lg">
                  Pemeriksaan
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Isi Naskah HTML Content */}
              <TabsContent value="isi" className="mt-4 flex-1">
                <div className="bg-muted/10 rounded-xl border border-border/50 p-6 min-h-[300px] overflow-auto text-sm">
                  <div 
                    className="prose prose-sm dark:prose-invert max-w-none font-serif leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: document.bodyHtml }}
                  />
                </div>
              </TabsContent>

              {/* Tab 2: Attachment / Lampiran */}
              <TabsContent value="attachment" className="mt-4 flex-1">
                <div className="p-4 bg-muted/10 rounded-xl border border-border/50 space-y-3">
                  <span className="text-xs font-bold text-muted-foreground block">Dokumen Surat / Fax Lampiran</span>
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-neutral-800 rounded-xl border border-border/60">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-[#145f74]" />
                      <div>
                        <a 
                          href="#" 
                          onClick={(e) => { e.preventDefault(); alert("Mengunduh lampiran resmi...") }}
                          className="font-semibold text-xs text-[#145f74] hover:underline block"
                        >
                          Lampiran_{document.documentNumber ? document.documentNumber.replace(/\//g, "_") : "Dokumen"}.pdf
                        </a>
                        <span className="text-[10px] text-muted-foreground">PDF Document • 1.64 MB</span>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-[#145f74]">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 3: Pemeriksaan & Riwayat Paraf Verifikator */}
              <TabsContent value="paraf" className="mt-4 flex-1">
                <div className="p-4 bg-muted/10 rounded-xl border border-border/50 space-y-3">
                  <span className="text-xs font-bold text-muted-foreground block">Rantai Paraf & Pengesahan</span>
                  {document.approvals && document.approvals.length > 0 ? (
                    <div className="space-y-2">
                      {document.approvals.map((app, i) => (
                        <div key={app.id} className="p-3 bg-white dark:bg-neutral-800 rounded-xl border border-border/50 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold block">{app.reviewerPosition?.title || "Verifikator"}</span>
                            <span className="text-[10px] text-muted-foreground">{app.approvalRole} • {app.notes || "Tanpa catatan."}</span>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={
                              app.actionStatus === "APPROVED" 
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" 
                                : app.actionStatus === "REJECTED"
                                ? "bg-destructive/10 text-destructive border-destructive/30"
                                : "bg-muted text-muted-foreground"
                            }
                          >
                            {app.actionStatus}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">Belum ada catatan paraf verifikator.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* ================= RIGHT PANEL: DISPOSISI / TERUSKAN / REVIU ================= */}
        <div className="space-y-6">
          
          {/* Review / Approval Form if document is under review */}
          {document.canReview && (
            <DocumentReviewCard 
              documentId={documentId} 
              isSigner={document.isSigner}
            />
          )}

          {/* Disposition Form if document is published and user has permission */}
          {document.canDisposition && (
            <DispositionForm documentId={documentId} />
          )}

          {/* If not in review and not dispositionable, show status banner */}
          {!document.canReview && !document.canDisposition && (
            <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] border border-border/60 p-6 shadow-ambient">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-[#145f74]" />
                <div>
                  <h4 className="font-bold text-sm">Status Naskah: {document.currentStatus}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {document.currentStatus === "DRAFT" 
                      ? "Naskah masih dalam bentuk konsep dan belum diajukan untuk reviu."
                      : "Anda memiliki hak akses baca untuk naskah dinas ini."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* LOWER SECTION: TINDAKAN & RIWAYAT TINDAKAN (Image 5 Benchmark) */}
          <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] border border-border/60 shadow-ambient p-6 flex flex-col">
            <Tabs defaultValue="riwayat" className="w-full">
              <TabsList className="bg-muted/30 border border-border/40 rounded-xl h-11 p-1 grid grid-cols-2 w-full mb-4">
                <TabsTrigger value="tindakan" className="text-xs font-bold data-[state=active]:bg-[#145f74] data-[state=active]:text-white rounded-lg">
                  Tindakan Untuk Saya ({document.myActiveDispositions?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="riwayat" className="text-xs font-bold data-[state=active]:bg-[#145f74] data-[state=active]:text-white rounded-lg">
                  Riwayat Tindakan (Lineage)
                </TabsTrigger>
              </TabsList>

              {/* Tab: Tindakan Untuk Saya (Active Instructions) */}
              <TabsContent value="tindakan" className="space-y-4">
                {document.myActiveDispositions && document.myActiveDispositions.length > 0 ? (
                  document.myActiveDispositions.map((disp: any) => (
                    <div key={disp.id} className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#145f74]">
                          Dari: {disp.fromPosition?.title || "Atasan"}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-bold">
                          {disp.transmissionMode}
                        </Badge>
                      </div>

                      {disp.actionChecklist && disp.actionChecklist.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {disp.actionChecklist.map((act: string, idx: number) => (
                            <span key={idx} className="bg-[#145f74] text-white px-2.5 py-1 rounded-md text-xs font-bold">
                              ✓ {act}
                            </span>
                          ))}
                        </div>
                      )}

                      {disp.instructionNotes && (
                        <p className="text-xs bg-white dark:bg-neutral-800 p-3 rounded-xl border border-border/50 text-foreground leading-relaxed">
                          "{disp.instructionNotes}"
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-xs">
                    Tidak ada instruksi khusus yang ditujukan langsung ke posisi Anda saat ini.
                  </div>
                )}
              </TabsContent>

              {/* Tab: Riwayat Tindakan (Lineage Tree from Image 5) */}
              <TabsContent value="riwayat" className="space-y-4">
                {document.dispositions && document.dispositions.length > 0 ? (
                  <div className="space-y-4 relative before:absolute before:inset-0 before:left-3 before:h-full before:w-0.5 before:bg-border/60">
                    {document.dispositions.map((disp: any, i: number) => (
                      <div key={disp.id} className="relative pl-8 space-y-2">
                        {/* Timeline Bullet */}
                        <div className="absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-[#145f74] border-2 border-white dark:border-neutral-900 shadow-sm" />
                        
                        <div className="p-4 bg-muted/20 border border-border/50 rounded-2xl space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-foreground">
                              {disp.fromPosition?.title || "Pemberi Disposisi"} → {disp.toPosition?.title || "Penerima"}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(disp.createdAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>

                          {disp.actionChecklist && disp.actionChecklist.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {disp.actionChecklist.map((item: string, idx: number) => (
                                <span key={idx} className="bg-[#145f74]/10 text-[#145f74] px-2 py-0.5 rounded text-[10px] font-semibold">
                                  {item}
                                </span>
                              ))}
                            </div>
                          )}

                          {disp.instructionNotes && (
                            <p className="text-xs text-muted-foreground italic">
                              "{disp.instructionNotes}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-xs">
                    Belum ada riwayat disposisi untuk naskah dinas ini.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

        </div>

      </div>
    </div>
  )
}

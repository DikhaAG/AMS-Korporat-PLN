"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Paperclip, History, CheckCircle } from "lucide-react"
import { useTRPC } from "@/trpc/client"
import { DispositionForm } from "@/components/disposition/disposition-form"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"

export default function DocumentDetailPage() {
  const params = useParams()
  const trpc = useTRPC()
  const documentId = params.id as string

  const { data: document, isLoading, error } = useQuery(
    trpc.document.getDocument.queryOptions({ id: documentId })
  )

  if (isLoading) {
    return <div className="p-12 text-center text-muted-foreground animate-pulse">Memuat Data Surat...</div>
  }

  if (error || !document) {
    return <div className="p-12 text-center text-destructive">Gagal memuat dokumen: {error?.message || "Tidak ditemukan"}</div>
  }

  const formattedDate = new Date(document.createdAt).toLocaleString("id-ID", {
    dateStyle: "short",
    timeStyle: "short"
  })

  return (
    <div className="flex flex-col h-full bg-transparent w-full max-w-[1600px] mx-auto pb-12 px-2">
      
      {/* Vanguard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-4">
          Detail & Disposisi Naskah
        </h1>
        <p className="text-muted-foreground mt-2 text-sm max-w-xl">
          Tinjau dokumen dan berikan arahan disposisi kepada unit terkait.
        </p>
      </div>

      {/* BENTO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6 xl:gap-8 flex-1 h-full min-h-[700px]">
        
        {/* LEFT BENTO: Data Surat */}
        <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-3xl rounded-[2rem] border border-black/5 dark:border-white/10 shadow-ambient p-2 flex flex-col h-full overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none rounded-[2rem]" />
          
          <div className="bg-primary/5 rounded-[1.5rem] p-6 mb-2 border border-primary/10 relative shrink-0">
            <h2 className="text-primary font-bold tracking-widest text-xs uppercase mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" /> Data Naskah Dinas
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-y-4 text-sm relative z-10">
              <div className="font-semibold text-muted-foreground">Status</div>
              <div className="font-medium">
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs font-bold">
                  {document.currentStatus}
                </span>
              </div>

              <div className="font-semibold text-muted-foreground">Tipe Naskah</div>
              <div className="font-medium">: {document.documentType}</div>

              <div className="font-semibold text-muted-foreground">Dibuat Pada</div>
              <div className="font-medium">: {formattedDate}</div>

              <div className="font-semibold text-muted-foreground">Nomor Surat</div>
              <div className="font-medium text-primary">: {document.documentNumber || "Belum ada nomor (Draft)"}</div>

              <div className="font-semibold text-muted-foreground">Sifat / Urgensi</div>
              <div className="font-medium">: {document.securityLevel} / {document.urgencyLevel}</div>

              <div className="font-semibold text-muted-foreground">Hal</div>
              <div className="font-medium leading-relaxed font-bold">: {document.subject}</div>
            </div>
          </div>

          <div className="flex-1 bg-white dark:bg-neutral-800 rounded-[1.5rem] border border-border/50 p-6 flex flex-col relative overflow-auto">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-primary" />
              Isi Naskah / Tinjauan
            </h3>
            
            <div 
              className="prose prose-sm dark:prose-invert max-w-none bg-muted/10 p-6 rounded-xl border border-border/50 min-h-[300px]"
              dangerouslySetInnerHTML={{ __html: document.bodyHtml }}
            />
          </div>
        </div>

        {/* RIGHT BENTO: Tindakan & Form */}
        <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-3xl rounded-[2rem] border border-black/5 dark:border-white/10 shadow-ambient p-2 flex flex-col h-full overflow-hidden relative">
          
          <Tabs defaultValue="tindakan" className="flex flex-col flex-1 h-full">
            <TabsList className="bg-muted/30 border border-border/50 rounded-full h-14 p-1.5 grid grid-cols-2 w-full max-w-sm mx-auto mt-4 mb-2 shadow-inner-glow shrink-0">
              <TabsTrigger 
                value="tindakan" 
                className="rounded-full h-full text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
              >
                Disposisi
              </TabsTrigger>
              <TabsTrigger 
                value="riwayat" 
                className="rounded-full h-full text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
              >
                Riwayat (Lineage)
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 p-2 overflow-auto relative">
              <TabsContent value="tindakan" className="m-0 h-full">
                <DispositionForm documentId={documentId} />
              </TabsContent>

              <TabsContent value="riwayat" className="bg-white dark:bg-neutral-800 rounded-[1.5rem] border border-border/50 p-8 m-0 h-full flex flex-col">
                <h3 className="font-bold text-lg mb-6">Pohon Disposisi (Lineage)</h3>
                
                {document.dispositions && document.dispositions.length > 0 ? (
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                    {document.dispositions.map((disp: any, i: number) => (
                      <div key={disp.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        {/* Timeline Icon */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-neutral-800 bg-primary/20 text-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        {/* Card */}
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-muted/20 p-4 rounded-2xl border border-border/50 shadow-sm">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-primary mb-1 tracking-wide">{disp.dispositionType}</span>
                            <span className="font-semibold text-sm">Ke Posisi: {disp.toPositionId}</span>
                            <p className="text-xs text-muted-foreground mt-2">{disp.instructionNotes || "Tanpa catatan tambahan."}</p>
                            
                            {disp.actionChecklist && disp.actionChecklist.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1">
                                {disp.actionChecklist.map((item: string, idx: number) => (
                                  <span key={idx} className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-[10px] font-bold">
                                    {item}
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            <span className="text-[10px] text-muted-foreground mt-3 pt-3 border-t border-border/50">
                              {new Date(disp.createdAt).toLocaleString("id-ID")}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                      <History className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-bold text-xl mb-2">Belum Ada Riwayat</h3>
                    <p className="text-muted-foreground max-w-sm">Surat ini belum memiliki riwayat tindakan atau disposisi sebelumnya.</p>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>

      </div>
    </div>
  )
}


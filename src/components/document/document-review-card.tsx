"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { documentReviewActionSchema, DocumentReviewActionInput } from "@/shared/schemas/document"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/client"
import { 
  CheckCircle2, 
  RotateCcw, 
  XCircle, 
  PenTool, 
  ShieldCheck, 
  Loader2
} from "lucide-react"

interface DocumentReviewCardProps {
  documentId: string
  isSigner: boolean
  onSuccess?: () => void
}

export function DocumentReviewCard({ documentId, isSigner, onSuccess }: DocumentReviewCardProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [selectedAction, setSelectedAction] = useState<"APPROVED" | "REVISED" | "REJECTED" | null>(null)

  const reviewMutation = useMutation(
    trpc.document.reviewDocument.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [["document", "getDocument"]] })
        queryClient.invalidateQueries({ queryKey: [["document", "getDocuments"]] })
        if (onSuccess) onSuccess()
      }
    })
  )

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<DocumentReviewActionInput>({
    resolver: zodResolver(documentReviewActionSchema),
    defaultValues: {
      documentId,
      actionStatus: "APPROVED",
      notes: "",
    }
  })

  const handleAction = (action: "APPROVED" | "REVISED" | "REJECTED") => {
    setSelectedAction(action)
    setValue("actionStatus", action)
  }

  const onSubmit = (values: DocumentReviewActionInput) => {
    reviewMutation.mutate(values)
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] border border-border/60 p-6 shadow-ambient flex flex-col gap-6">
      {/* Header Badge */}
      <div className="flex items-center justify-between pb-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            {isSigner ? <ShieldCheck className="w-5 h-5 text-primary" /> : <PenTool className="w-5 h-5 text-primary" />}
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground">
              {isSigner ? "Persetujuan & Penandatanganan (TTE)" : "Pemeriksaan & Paraf Verifikator"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isSigner 
                ? "Naskah akan diberi Nomor Otomatis dan Tanda Tangan Elektronik resmi." 
                : "Berikan paraf persetujuan atau catatan revisi sebelum diteruskan ke penandatangan."}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Catatan Reviu */}
        <div className="space-y-2">
          <label className="text-sm font-bold flex items-center justify-between">
            <span>Catatan / Keterangan Reviu</span>
            <span className="text-xs font-normal text-muted-foreground">
              {selectedAction === "REVISED" || selectedAction === "REJECTED" ? "Wajib diisi" : "Opsional"}
            </span>
          </label>
          <Textarea 
            placeholder={
              isSigner 
                ? "Tambahkan instruksi pengesahan atau catatan resmi..." 
                : "Tuliskan catatan perbaikan atau alasan persetujuan paraf..."
            }
            className="min-h-[100px] rounded-xl bg-muted/20 border-border/50 focus-visible:ring-primary/40 text-sm p-3.5 resize-none"
            {...register("notes")}
          />
          {errors.notes && <p className="text-xs text-destructive">{errors.notes.message}</p>}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Approve / Sign Button */}
          <Button
            type="submit"
            onClick={() => handleAction("APPROVED")}
            disabled={reviewMutation.isPending}
            className="h-12 rounded-xl bg-[#145f74] hover:bg-[#104d5e] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            {reviewMutation.isPending && selectedAction === "APPROVED" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isSigner ? (
              <>
                <ShieldCheck className="w-4 h-4" />
                Tandatangani (TTE)
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Setujui & Paraf
              </>
            )}
          </Button>

          {/* Revise Button */}
          <Button
            type="submit"
            variant="outline"
            onClick={() => handleAction("REVISED")}
            disabled={reviewMutation.isPending}
            className="h-12 rounded-xl border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
          >
            {reviewMutation.isPending && selectedAction === "REVISED" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                Minta Revisi
              </>
            )}
          </Button>

          {/* Reject Button */}
          <Button
            type="submit"
            variant="outline"
            onClick={() => handleAction("REJECTED")}
            disabled={reviewMutation.isPending}
            className="h-12 rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
          >
            {reviewMutation.isPending && selectedAction === "REJECTED" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                Tolak Naskah
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

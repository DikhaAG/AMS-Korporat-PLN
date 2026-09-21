"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { dispositionActionSchema, DispositionActionInput } from "@/shared/schemas/document"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowRight, CornerDownRight, CheckCircle2 } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/client"

const INSTRUCTION_OPTIONS = [
  "Untuk Diketahui",
  "Untuk Diperhatikan",
  "Siapkan Konsep",
  "Tindak Lanjut",
  "Hadiri / Wakili",
  "Bicarakan"
]

export function DispositionForm({ documentId, onSuccess }: { documentId: string, onSuccess?: () => void }) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const createDispositionMutation = useMutation(
    trpc.document.createDisposition.mutationOptions({
      onSuccess: () => {
        // Re-fetch document to see the new disposition
        queryClient.invalidateQueries({ queryKey: [["document", "getDocument"]] })
        if (onSuccess) onSuccess()
      }
    })
  )

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<DispositionActionInput>({
    // @ts-ignore
    resolver: zodResolver(dispositionActionSchema),
    defaultValues: {
      documentId,
      dispositionType: "OPEN",
      actionChecklist: [],
      toPositionId: "", // Will be selected by user
      instructionNotes: "",
    }
  })

  const actionChecklist = watch("actionChecklist")

  const toggleChecklist = (item: string) => {
    if (actionChecklist.includes(item)) {
      setValue("actionChecklist", actionChecklist.filter(i => i !== item))
    } else {
      setValue("actionChecklist", [...actionChecklist, item])
    }
  }

  const onSubmit = (values: DispositionActionInput) => {
    createDispositionMutation.mutate(values)
  }

  return (
    // @ts-ignore
    <form onSubmit={handleSubmit(onSubmit as any)} className="bg-white dark:bg-neutral-800 rounded-[1.5rem] border border-border/50 p-6 space-y-8 m-0 h-full flex flex-col">
      
      {/* Tipe Disposisi */}
      <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/50 shrink-0">
        <span className="font-bold text-sm tracking-wide">Tipe Disposisi</span>
        <Controller
          control={control}
          name="dispositionType"
          render={({ field }) => (
            <RadioGroup 
              value={field.value} 
              onValueChange={field.onChange} 
              className="flex bg-white rounded-lg p-1 border border-border/50 shadow-sm"
            >
              <div className="flex items-center">
                <RadioGroupItem value="OPEN" id="type-open" className="peer sr-only" />
                <label htmlFor="type-open" className="cursor-pointer px-4 py-1.5 text-sm font-medium rounded-md peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-white transition-colors">Terbuka</label>
              </div>
              <div className="flex items-center">
                <RadioGroupItem value="CLOSED" id="type-closed" className="peer sr-only" />
                <label htmlFor="type-closed" className="cursor-pointer px-4 py-1.5 text-sm font-medium rounded-md peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-white transition-colors">Tertutup</label>
              </div>
            </RadioGroup>
          )}
        />
      </div>

      {/* Chiclet Grid */}
      <div className="shrink-0">
        <h3 className="font-bold text-sm mb-4">Pilih Instruksi</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {INSTRUCTION_OPTIONS.map((item, index) => {
            const isChecked = actionChecklist.includes(item)
            return (
              <label 
                key={item}
                className={`
                  relative flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 ease-[var(--ease-fluid)] select-none
                  ${isChecked ? 'border-primary bg-primary/5 shadow-inner-glow' : 'border-border/50 bg-white hover:border-primary/30'}
                `}
                onClick={() => toggleChecklist(item)}
              >
                <div className="flex items-center gap-3">
                  <Checkbox 
                    checked={isChecked} 
                    className="data-[state=checked]:bg-primary rounded-md pointer-events-none"
                  />
                  <span className={`text-sm font-semibold ${isChecked ? 'text-primary' : 'text-foreground/80'}`}>
                    {index + 1}. {item}
                  </span>
                </div>
                {isChecked && <CheckCircle2 className="w-5 h-5 text-primary animate-in zoom-in duration-300" />}
              </label>
            )
          })}
        </div>
        {errors.actionChecklist && <p className="text-xs text-destructive mt-2">{errors.actionChecklist.message}</p>}
      </div>

      {/* Kepada & Keterangan */}
      <div className="space-y-6 flex-1">
        <div>
          <label className="font-bold text-sm block mb-3">Teruskan Kepada (ID Posisi)</label>
          <div className="space-y-3 pl-4 border-l-2 border-muted">
            <div className="relative">
              <CornerDownRight className="absolute -left-8 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Masukkan ID Posisi Tujuan (UUID)..." 
                className="h-12 rounded-xl bg-muted/20 border-border/50 focus-visible:ring-primary/30 text-base font-mono" 
                {...register("toPositionId")}
              />
            </div>
            {errors.toPositionId && <p className="text-xs text-destructive">{errors.toPositionId.message}</p>}
          </div>
        </div>

        <div>
          <label className="font-bold text-sm block mb-3">Keterangan / Catatan</label>
          <Textarea 
            placeholder="Tambahkan instruksi spesifik disini..." 
            className="resize-none h-32 rounded-xl bg-muted/20 border-border/50 focus-visible:ring-primary/30 text-base p-4" 
            {...register("instructionNotes")}
          />
        </div>
      </div>
      
      {/* Magnetic CTA Action */}
      <div className="pt-4 pb-2 shrink-0">
        <button 
          type="submit"
          disabled={createDispositionMutation.isPending}
          className="group relative w-full flex items-center justify-center bg-[#145f74] hover:bg-[#125365] text-white rounded-2xl h-14 font-bold text-base transition-all duration-700 ease-[var(--ease-fluid)] active:scale-[0.98] shadow-inner-glow disabled:opacity-70"
        >
          {createDispositionMutation.isPending ? "MEMPROSES..." : "KIRIM DISPOSISI"}
          <div className="absolute right-2 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center transition-all duration-700 ease-[var(--ease-fluid)] group-hover:bg-white/20 group-hover:scale-105 group-hover:-translate-y-[1px]">
            <ArrowRight className="h-5 w-5" />
          </div>
        </button>
      </div>
    </form>
  )
}

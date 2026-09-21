"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { dispositionActionSchema, DispositionActionInput } from "@/shared/schemas/document"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { ArrowRight, CheckCircle2, ChevronsUpDown, Check, Send, Share2 } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/client"
import { cn } from "@/lib/utils"

import { z } from "zod"

// 12 Standard Action Checklists from PLN AMS Korporat Benchmark (Image 5)
const BENCHMARK_ACTION_CHECKLIST = [
  "Untuk Diketahui",
  "Untuk Diperhatikan",
  "Untuk Dipelajari",
  "Disiapkan Jawaban",
  "Jawab Langsung",
  "ACC Untuk Ditindak Lanjuti",
  "Ambil Langkah Seperlunya",
  "Dibicarakan",
  "Dilaporkan",
  "Segera Diselesaikan",
  "Copy untuk ....",
  "Lainnya"
]

export function DispositionForm({ documentId, onSuccess }: { documentId: string, onSuccess?: () => void }) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const positionsQuery = useQuery(trpc.document.getRecipientPositions.queryOptions())

  const createDispositionMutation = useMutation(
    trpc.document.createDisposition.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [["document", "getDocument"]] })
        queryClient.invalidateQueries({ queryKey: [["document", "getDocuments"]] })
        if (onSuccess) onSuccess()
      }
    })
  )

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<z.input<typeof dispositionActionSchema>, any, DispositionActionInput>({
    resolver: zodResolver(dispositionActionSchema),
    defaultValues: {
      documentId,
      transmissionMode: "DISPOSITION",
      dispositionType: "OPEN",
      actionChecklist: ["Untuk Diketahui"],
      toPositionId: "",
      instructionNotes: "",
    }
  })

  const transmissionMode = watch("transmissionMode")
  const actionChecklist = watch("actionChecklist") || []
  const selectedPositionId = watch("toPositionId")

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

  const selectedPosition = positionsQuery.data?.find(p => p.id === selectedPositionId)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-neutral-900 rounded-[1.5rem] border border-border/60 p-6 space-y-6 flex flex-col shadow-ambient">
      
      {/* Top Selector: Disposisi vs Teruskan (Matching Image 5 Header) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
        <h3 className="font-bold text-base text-foreground flex items-center gap-2">
          {transmissionMode === "DISPOSITION" ? (
            <>
              <Send className="w-4 h-4 text-[#145f74]" />
              Formulir Disposisi Naskah
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-[#145f74]" />
              Teruskan Naskah Dinas
            </>
          )}
        </h3>

        <Controller
          control={control}
          name="transmissionMode"
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="flex items-center gap-4 bg-muted/30 p-1.5 rounded-xl border border-border/40"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="DISPOSITION" id="mode-disposition" />
                <label htmlFor="mode-disposition" className="text-xs font-bold cursor-pointer select-none">
                  Disposisi
                </label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="FORWARD" id="mode-forward" />
                <label htmlFor="mode-forward" className="text-xs font-bold cursor-pointer select-none">
                  Teruskan
                </label>
              </div>
            </RadioGroup>
          )}
        />
      </div>

      {/* 12 Standard Aksi Checklist in 2 Columns (Image 5 Benchmark) */}
      <div className="space-y-3">
        <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
          Aksi / Tindakan ({actionChecklist.length} dipilih)
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {BENCHMARK_ACTION_CHECKLIST.map((item, index) => {
            const isChecked = actionChecklist.includes(item)
            return (
              <div
                key={item}
                onClick={() => toggleChecklist(item)}
                className={cn(
                  "flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all select-none",
                  isChecked 
                    ? "border-[#145f74] bg-[#145f74]/5 text-[#145f74] font-semibold" 
                    : "border-border/40 bg-muted/10 hover:border-border/80 text-foreground/80"
                )}
              >
                <Checkbox
                  checked={isChecked}
                  className="data-[state=checked]:bg-[#145f74] data-[state=checked]:border-[#145f74] h-4 w-4 rounded"
                />
                <span className="truncate">
                  {index + 1}. {item}
                </span>
              </div>
            )
          })}
        </div>
        {errors.actionChecklist && (
          <p className="text-xs text-destructive">{errors.actionChecklist.message}</p>
        )}
      </div>

      {/* Kepada: Dynamic Position Combobox */}
      <div className="space-y-2">
        <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
          Kepada (Posisi Penerima)
        </label>
        <Controller
          control={control}
          name="toPositionId"
          render={({ field }) => (
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between h-12 rounded-xl bg-muted/20 border-border/50 text-sm font-normal text-left px-4",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    <span className="truncate">
                      {selectedPosition 
                        ? `${selectedPosition.title} (${selectedPosition.code})` 
                        : "Pilih posisi bawahan / unit penerima..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                }
              />
              <PopoverContent className="w-[450px] p-0 rounded-xl shadow-ambient" align="start">
                <Command>
                  <CommandInput placeholder="Cari posisi atau jabatan..." className="h-10 text-xs" />
                  <CommandList>
                    <CommandEmpty>Posisi tidak ditemukan.</CommandEmpty>
                    <CommandGroup heading="Daftar Posisi Organisasi">
                      {positionsQuery.data?.map((pos) => (
                        <CommandItem
                          key={pos.id}
                          value={`${pos.title} ${pos.code}`}
                          onSelect={() => field.onChange(pos.id)}
                          className="flex items-center justify-between text-xs py-2"
                        >
                          <div className="flex flex-col">
                            <span className="font-semibold">{pos.title}</span>
                            <span className="text-[10px] text-muted-foreground">{pos.code}</span>
                          </div>
                          <Check
                            className={cn(
                              "h-4 w-4 text-[#145f74]",
                              field.value === pos.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        />
        {errors.toPositionId && (
          <p className="text-xs text-destructive">{errors.toPositionId.message}</p>
        )}
      </div>

      {/* Keterangan / Instruksi Tambahan */}
      <div className="space-y-2">
        <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
          Keterangan / Catatan Tambahan
        </label>
        <Textarea
          placeholder="Tambahkan arahan detail atau batas waktu penyelesaian..."
          className="min-h-[85px] rounded-xl bg-muted/20 border-border/50 focus-visible:ring-[#145f74]/30 text-xs p-3 resize-none"
          {...register("instructionNotes")}
        />
      </div>

      {/* Tipe Disposisi: Terbuka vs Tertutup (Image 5 Benchmark) */}
      <div className="flex items-center justify-between p-3.5 bg-muted/20 rounded-xl border border-border/40">
        <div>
          <span className="font-bold text-xs">Tipe Disposisi</span>
          <p className="text-[10px] text-muted-foreground">
            {watch("dispositionType") === "OPEN" 
              ? "Terbuka: dapat dilihat seluruh rantai disposisi unit." 
              : "Tertutup: hanya terbaca oleh pemberi & penerima instruksi."}
          </p>
        </div>

        <Controller
          control={control}
          name="dispositionType"
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="flex items-center gap-3"
            >
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="OPEN" id="type-open" />
                <label htmlFor="type-open" className="text-xs font-medium cursor-pointer">
                  Terbuka
                </label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="CLOSED" id="type-closed" />
                <label htmlFor="type-closed" className="text-xs font-medium cursor-pointer">
                  Tertutup
                </label>
              </div>
            </RadioGroup>
          )}
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={createDispositionMutation.isPending || !selectedPositionId}
        className="w-full h-12 rounded-xl bg-[#145f74] hover:bg-[#104d5e] text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
      >
        {createDispositionMutation.isPending ? (
          "Mengirim Instruksi..."
        ) : (
          <>
            {transmissionMode === "DISPOSITION" ? "Kirim Disposisi" : "Teruskan Naskah"}
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>
    </form>
  )
}

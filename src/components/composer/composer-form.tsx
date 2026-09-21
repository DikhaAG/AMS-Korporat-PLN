"use client"

import { z } from "zod"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createDocumentDraftSchema, CreateDocumentDraftInput } from "@/shared/schemas/document"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ComposerEditor } from "./composer-editor"
import { useTRPC } from "@/trpc/client"
import { useRouter } from "next/navigation"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown, Save } from "lucide-react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"

export function ComposerForm() {
  const trpc = useTRPC()
  const router = useRouter()

  const positionsQuery = useQuery(trpc.document.getRecipientPositions.queryOptions())

  const createMutation = useMutation(
    trpc.document.createDraft.mutationOptions({
      onSuccess: (data: any) => {
        // Navigate to the newly created document details view
        router.push(`/document/${data.id}`)
      }
    })
  )

  const { register, handleSubmit, control, formState: { errors } } = useForm<z.input<typeof createDocumentDraftSchema>, any, CreateDocumentDraftInput>({
    resolver: zodResolver(createDocumentDraftSchema),
    defaultValues: {
      documentType: "OUTGOING_LETTER",
      subject: "",
      bodyHtml: "",
      securityLevel: "REGULAR",
      urgencyLevel: "REGULAR",
      classificationCode: "UMUM",
      recipientPositionIds: [],
    }
  })

  const onSubmit = (values: CreateDocumentDraftInput) => {
    createMutation.mutate(values)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-6 rounded-3xl border border-border/50 shadow-inner-glow">

        <div className="space-y-2">
          <label className="text-sm font-medium">Jenis Naskah</label>
          <Controller
            control={control}
            name="documentType"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Pilih Jenis Naskah" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="DINAS_NOTE">Nota Dinas</SelectItem>
                  <SelectItem value="OUTGOING_LETTER">Surat Keluar</SelectItem>
                  <SelectItem value="ASSIGNMENT_LETTER">Surat Tugas</SelectItem>
                  <SelectItem value="CIRCULAR_LETTER">Surat Edaran</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.documentType && <p className="text-sm text-destructive">{errors.documentType.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Sifat Naskah (Keamanan)</label>
          <Controller
            control={control}
            name="securityLevel"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Pilih Sifat" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="REGULAR">Biasa</SelectItem>
                  <SelectItem value="RESTRICTED">Terbatas</SelectItem>
                  <SelectItem value="CONFIDENTIAL">Rahasia</SelectItem>
                  <SelectItem value="TOP_SECRET">Sangat Rahasia</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Tingkat Urgensi</label>
          <Controller
            control={control}
            name="urgencyLevel"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Pilih Urgensi" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="REGULAR">Biasa</SelectItem>
                  <SelectItem value="URGENT">Segera</SelectItem>
                  <SelectItem value="FLASH">Sangat Segera / Kilat</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Klasifikasi Arsip</label>
          <Input placeholder="Contoh: KU.01.01" className="rounded-xl" {...register("classificationCode")} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Hal / Perihal</label>
          <Input placeholder="Tuliskan perihal naskah dinas..." className="rounded-xl font-semibold text-lg" {...register("subject")} />
          {errors.subject && <p className="text-sm text-destructive">{errors.subject.message}</p>}
        </div>

        <div className="space-y-2 md:col-span-2 flex flex-col">
          <label className="text-sm font-medium">Penerima (Recipients)</label>
          <Controller
            control={control}
            name="recipientPositionIds"
            render={({ field }) => (
              <Popover>
                <PopoverTrigger render={
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between p-3 h-auto min-h-[50px] rounded-xl border border-input bg-transparent text-sm shadow-sm",
                      !field.value.length && "text-muted-foreground"
                    )}
                  >
                    <div className="flex flex-wrap gap-1 items-center text-left">
                      {field.value.length > 0 ? (
                        field.value.map(val => {
                          const pos = positionsQuery.data?.find(p => p.id === val)
                          return pos ? (
                            <span key={val} className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-semibold">
                              {pos.title}
                            </span>
                          ) : null
                        })
                      ) : (
                        "Pilih penerima naskah..."
                      )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                }>

                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0 rounded-xl" align="start">
                  <Command>
                    <CommandInput placeholder="Cari posisi..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>Tidak ada posisi yang ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {positionsQuery.data?.map((position) => (
                          <CommandItem
                            value={position.title}
                            key={position.id}
                            onSelect={() => {
                              const isSelected = field.value.includes(position.id)
                              if (isSelected) {
                                field.onChange(field.value.filter(id => id !== position.id))
                              } else {
                                field.onChange([...field.value, position.id])
                              }
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value.includes(position.id) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {position.title}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          />
          {errors.recipientPositionIds && <p className="text-sm text-destructive">{errors.recipientPositionIds.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label className="sr-only">Isi Naskah</label>
        <Controller
          control={control}
          name="bodyHtml"
          render={({ field }) => (
            <ComposerEditor value={field.value} onChange={field.onChange} />
          )}
        />
        {errors.bodyHtml && <p className="text-sm text-destructive">{errors.bodyHtml.message}</p>}
      </div>

      <div className="flex items-center justify-end gap-4 bg-muted/20 p-4 rounded-3xl border border-border/50">
        <Button type="button" variant="ghost" className="rounded-xl px-6 hover:bg-destructive/10 hover:text-destructive transition-colors">
          Batal
        </Button>
        <Button type="submit" disabled={createMutation.isPending} className="rounded-xl px-8 bg-[#145f74] hover:bg-[#125365] text-white shadow-ambient transition-all">
          {createMutation.isPending ? (
            <span className="flex items-center gap-2">Menyimpan...</span>
          ) : (
            <span className="flex items-center gap-2"><Save className="w-4 h-4" /> Simpan Draft</span>
          )}
        </Button>
      </div>
    </form>
  )
}

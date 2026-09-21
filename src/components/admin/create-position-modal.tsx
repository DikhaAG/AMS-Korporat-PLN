"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTRPC } from "@/trpc/client"
import { useQueryClient, useMutation } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { FolderPlus, PenTool } from "lucide-react"

const schema = z.object({
  code: z.string().min(1, "Kode tidak boleh kosong"),
  title: z.string().min(1, "Jabatan tidak boleh kosong"),
  isSigner: z.boolean(),
})

type CreatePositionForm = z.infer<typeof schema>

export function CreatePositionModal({ 
  open, 
  onOpenChange 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void 
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<CreatePositionForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: "",
      title: "",
      isSigner: false,
    }
  })

  const isSigner = watch("isSigner")

  const createMutation = useMutation(
    trpc.admin.createPosition.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [["admin", "getPositions"]] })
        onOpenChange(false)
        reset()
      }
    })
  )

  const onSubmit = (data: CreatePositionForm) => {
    createMutation.mutate({
      code: data.code,
      title: data.title,
      isSigner: data.isSigner,
      parentId: null, // by default placed at root, user can drag later
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-black/5 dark:border-white/10 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-3xl shadow-2xl rounded-3xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
        
        <div className="px-8 pt-8 pb-4">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <FolderPlus className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight">Posisi Baru</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              Posisi akan dibuat di tingkat atas. Anda dapat menariknya ke bawah posisi lain di struktur nanti.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-8 pb-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kode Jabatan</Label>
              <Input 
                id="code" 
                placeholder="MGR-01" 
                className="h-12 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md border-black/5 dark:border-white/10 focus-visible:ring-primary/30"
                {...register("code")} 
              />
              {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nama Jabatan</Label>
              <Input 
                id="title" 
                placeholder="Manager Pemasaran" 
                className="h-12 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md border-black/5 dark:border-white/10 focus-visible:ring-primary/30"
                {...register("title")} 
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 border border-primary/20 rounded-2xl bg-primary/5">
            <div className="mt-1 p-2 rounded-xl bg-primary/10">
              <PenTool className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-sm font-semibold text-foreground">Wewenang Tanda Tangan</Label>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Aktifkan jika posisi ini berhak menandatangani dokumen surat dinas atau nota dinas.
              </p>
            </div>
            <Switch 
              checked={isSigner} 
              onCheckedChange={(c: boolean) => setValue("isSigner", c)}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="rounded-full px-6 hover:bg-black/5 dark:hover:bg-white/5"
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending}
              className="rounded-full px-8 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              {createMutation.isPending ? "Menyimpan..." : "Simpan Posisi"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


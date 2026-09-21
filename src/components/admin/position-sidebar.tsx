"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTRPC } from "@/trpc/client"
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trash2, Users, FileSignature, X } from "lucide-react"

const schema = z.object({
  code: z.string().min(1, "Kode tidak boleh kosong"),
  title: z.string().min(1, "Jabatan tidak boleh kosong"),
  isSigner: z.boolean(),
})

type UpdatePositionForm = z.infer<typeof schema>

type PositionItem = {
  id: string
  code: string
  title: string
  parentId: string | null
  hierarchyPath: string
  isSigner?: boolean | null
}

export function PositionSidebar({ 
  position, 
  onClose 
}: { 
  position: PositionItem | null
  onClose: () => void 
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [selectedUserToAssign, setSelectedUserToAssign] = useState<string>("")
  
  const { register, handleSubmit, formState: { errors, isDirty }, reset, setValue, watch } = useForm<UpdatePositionForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: position?.code || "",
      title: position?.title || "",
      isSigner: position?.isSigner || false,
    }
  })

  useEffect(() => {
    if (position) {
      reset({
        code: position.code,
        title: position.title,
        isSigner: position.isSigner || false,
      })
    }
  }, [position, reset])

  const isSigner = watch("isSigner")

  // Data fetching for Users
  const { data: usersInPosition, isLoading: isLoadingUsers } = useQuery(
    trpc.admin.getUsersByPosition.queryOptions(
      { positionId: position?.id as string },
      { enabled: !!position }
    )
  )

  const { data: allUsers } = useQuery(
    trpc.admin.getUsers.queryOptions(undefined, { enabled: !!position })
  )

  // Mutations
  const updateMutation = useMutation(
    trpc.admin.updatePosition.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [["admin", "getPositions"]] })
        onClose()
      }
    })
  )

  const deleteMutation = useMutation(
    trpc.admin.deletePosition.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [["admin", "getPositions"]] })
        onClose()
      },
      onError: (err) => {
        alert(err.message)
      }
    })
  )

  const assignUserMutation = useMutation(
    trpc.admin.assignUserToPosition.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [["admin", "getUsersByPosition"]] })
        queryClient.invalidateQueries({ queryKey: [["admin", "getUsers"]] })
        setSelectedUserToAssign("")
      }
    })
  )

  const removeUserMutation = useMutation(
    trpc.admin.removeUserFromPosition.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [["admin", "getUsersByPosition"]] })
        queryClient.invalidateQueries({ queryKey: [["admin", "getUsers"]] })
      }
    })
  )

  const onSubmit = (data: UpdatePositionForm) => {
    if (!position) return
    updateMutation.mutate({
      id: position.id,
      code: data.code,
      title: data.title,
      isSigner: data.isSigner,
    })
  }

  const handleDelete = () => {
    if (!position) return
    deleteMutation.mutate({ id: position.id })
  }

  const handleAssignUser = () => {
    if (!position || !selectedUserToAssign) return
    assignUserMutation.mutate({
      userId: selectedUserToAssign,
      positionId: position.id
    })
  }

  // Find users who are NOT already in this position to populate the assignment dropdown
  const availableUsersToAssign = allUsers?.filter(u => u.positionId !== position?.id) || []

  return (
    <Sheet open={!!position} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md flex flex-col h-full bg-white/95 dark:bg-neutral-950/95 backdrop-blur-3xl border-l border-white/10 shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.1)] p-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary/40 via-primary to-primary/40" />
        
        <div className="px-8 pt-8 pb-4">
          <SheetHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileSignature className="w-5 h-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-xl font-bold tracking-tight">Detail Posisi</SheetTitle>
              </div>
            </div>
            <SheetDescription className="text-sm text-muted-foreground">
              Manajemen informasi jabatan dan delegasi pengguna untuk posisi ini.
            </SheetDescription>
          </SheetHeader>
        </div>

        <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-8">
            <TabsList className="w-full h-12 bg-muted/30 border border-black/5 dark:border-white/10 rounded-xl p-1 mb-4">
              <TabsTrigger value="details" className="w-full rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:shadow-sm">
                Detail Jabatan
              </TabsTrigger>
              <TabsTrigger value="users" className="w-full rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:shadow-sm">
                Pengguna ({usersInPosition?.length || 0})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="details" className="flex-1 overflow-y-auto px-8 pb-8 focus-visible:outline-none focus-visible:ring-0">
            <form id="position-details-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kode Jabatan</Label>
                  <Input 
                    id="code" 
                    className="h-11 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md border-black/5 dark:border-white/10 focus-visible:ring-primary/30"
                    {...register("code")} 
                  />
                  {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nama Jabatan</Label>
                  <Input 
                    id="title" 
                    className="h-11 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md border-black/5 dark:border-white/10 focus-visible:ring-primary/30"
                    {...register("title")} 
                  />
                  {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 border border-primary/20 rounded-2xl bg-primary/5">
                <div className="flex-1 space-y-1">
                  <Label className="text-sm font-semibold text-foreground">Wewenang Tanda Tangan</Label>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Aktifkan jika posisi ini berhak menandatangani dokumen dinas.
                  </p>
                </div>
                <Switch 
                  checked={isSigner} 
                  onCheckedChange={(c: boolean) => setValue("isSigner", c, { shouldDirty: true })} 
                  className="mt-1"
                />
              </div>
            </form>
          </TabsContent>

          <TabsContent value="users" className="flex-1 overflow-y-auto px-8 pb-8 focus-visible:outline-none focus-visible:ring-0">
            <div className="space-y-6">
              {/* Assignment Section */}
              <div className="space-y-3 p-5 rounded-2xl border border-black/5 dark:border-white/10 bg-muted/20">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tambah Pengguna ke Posisi
                </Label>
                <div className="flex gap-2">
                  <select 
                    className="flex-1 h-10 px-3 py-2 rounded-xl text-sm bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={selectedUserToAssign}
                    onChange={(e) => setSelectedUserToAssign(e.target.value)}
                  >
                    <option value="" disabled>Pilih pengguna...</option>
                    {availableUsersToAssign.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                  <Button 
                    type="button" 
                    disabled={!selectedUserToAssign || assignUserMutation.isPending}
                    onClick={handleAssignUser}
                    className="h-10 rounded-xl"
                  >
                    {assignUserMutation.isPending ? "Menyimpan..." : "Tambah"}
                  </Button>
                </div>
              </div>

              {/* Users List */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Pengguna Saat Ini
                </Label>
                
                {isLoadingUsers ? (
                  <div className="text-sm text-muted-foreground">Memuat pengguna...</div>
                ) : usersInPosition?.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-dashed border-black/10 dark:border-white/10 flex flex-col items-center justify-center text-center">
                    <Users className="w-8 h-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">Belum ada pengguna yang ditugaskan ke posisi ini.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {usersInPosition?.map(user => (
                      <div key={user.id} className="flex items-center gap-3 p-3 rounded-2xl border border-black/5 dark:border-white/10 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm group hover:border-primary/30 transition-colors">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user.image || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          disabled={removeUserMutation.isPending}
                          onClick={() => removeUserMutation.mutate({ userId: user.id })}
                          title="Hapus pengguna dari posisi"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer actions for Details tab (or globally) */}
        <div className="px-8 py-6 border-t border-black/5 dark:border-white/10 bg-white/50 dark:bg-neutral-950/50 backdrop-blur-md">
          <div className="flex gap-3">
            <AlertDialog>
              <AlertDialogTrigger 
                render={
                  <Button type="button" variant="outline" className="w-12 h-11 rounded-xl shrink-0 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 hover:border-destructive/30">
                    <Trash2 className="w-5 h-5" />
                  </Button>
                }
              />
              <AlertDialogContent className="rounded-3xl border-black/5 dark:border-white/10 shadow-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus Posisi?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Posisi ini tidak dapat dihapus jika masih ada pengguna yang menjabat atau jika masih memiliki bawahan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    {deleteMutation.isPending ? "Menghapus..." : "Ya, Hapus"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Button 
              type="submit" 
              form="position-details-form"
              className="flex-1 h-11 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all"
              disabled={!isDirty || updateMutation.isPending}
            >
              {updateMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}


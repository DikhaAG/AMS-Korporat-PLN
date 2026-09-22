"use client"

import { useEffect, useState } from "react"
import { useTRPC } from "@/trpc/client"
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Shield, ShieldAlert, Network, Briefcase, Mail, BadgeCheck } from "lucide-react"

export type UserItem = {
  id: string
  name: string
  email: string
  nip?: string | null
  role: string | null
  positionId: string | null
  image?: string | null
}

export function UserSidebar({ 
  user, 
  onClose 
}: { 
  user: UserItem | null
  onClose: () => void 
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  
  // Fetch available positions for assignment dropdown
  const { data: positions, isLoading: isLoadingPositions } = useQuery(
    trpc.admin.getPositions.queryOptions(undefined, { enabled: !!user })
  )

  const [selectedPositionId, setSelectedPositionId] = useState<string>("")

  useEffect(() => {
    if (user) {
      setSelectedPositionId(user.positionId || "")
    }
  }, [user])

  // Mutations
  const updateRoleMutation = useMutation(
    trpc.admin.updateUserRole.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [["admin", "getUsers"]] })
      }
    })
  )

  const assignPositionMutation = useMutation(
    trpc.admin.assignUserToPosition.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [["admin", "getUsers"]] })
        queryClient.invalidateQueries({ queryKey: [["admin", "getUsersByPosition"]] })
      }
    })
  )

  const removePositionMutation = useMutation(
    trpc.admin.removeUserFromPosition.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [["admin", "getUsers"]] })
        queryClient.invalidateQueries({ queryKey: [["admin", "getUsersByPosition"]] })
        setSelectedPositionId("")
      }
    })
  )

  const handleToggleRole = () => {
    if (!user) return
    const newRole = user.role === "admin" ? "user" : "admin"
    updateRoleMutation.mutate({ userId: user.id, role: newRole })
    // Optimistic local update (for UI snappiness during transition)
    user.role = newRole 
  }

  const handleAssignPosition = () => {
    if (!user || !selectedPositionId) return
    assignPositionMutation.mutate({ userId: user.id, positionId: selectedPositionId })
    user.positionId = selectedPositionId
  }

  const handleRemovePosition = () => {
    if (!user) return
    removePositionMutation.mutate({ userId: user.id })
    user.positionId = null
  }

  return (
    <Sheet open={!!user} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md flex flex-col h-full bg-white/95 dark:bg-neutral-950/95 backdrop-blur-3xl border-l border-white/10 shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.1)] p-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500/40 via-blue-500 to-blue-500/40" />
        
        <div className="px-8 pt-10 pb-6 bg-gradient-to-b from-blue-500/5 to-transparent border-b border-black/5 dark:border-white/5">
          <SheetHeader className="text-left">
            <div className="flex items-center gap-4 mb-2">
              <Avatar className="w-16 h-16 border-2 border-white dark:border-neutral-900 shadow-md">
                <AvatarImage src={user?.image || undefined} />
                <AvatarFallback className="bg-blue-500/10 text-blue-500 text-xl font-bold">
                  {user?.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-2xl font-bold tracking-tight truncate">{user?.name}</SheetTitle>
                <div className="flex flex-col gap-1 mt-1 text-muted-foreground text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{user?.email}</span>
                  </div>
                  {user?.nip && (
                    <div className="flex items-center gap-1.5 font-mono text-primary font-semibold">
                      <BadgeCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>NIP: {user.nip}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          {/* Role Section */}
          <div className="space-y-4">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" />
              Role Akses Sistem
            </Label>
            
            <div className={`relative overflow-hidden rounded-2xl border transition-colors ${user?.role === 'admin' ? 'border-destructive/30 bg-destructive/5' : 'border-primary/20 bg-primary/5'} p-5`}>
              {user?.role === 'admin' && (
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-destructive/10 blur-3xl rounded-full pointer-events-none" />
              )}
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold tracking-tight ${user?.role === 'admin' ? 'text-destructive' : 'text-primary'}`}>
                      {user?.role === 'admin' ? 'SUPERADMIN' : 'PENGGUNA STANDAR'}
                    </span>
                    {user?.role === 'admin' && <ShieldAlert className="w-4 h-4 text-destructive" />}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {user?.role === 'admin' 
                      ? 'Memiliki akses penuh ke pengaturan sistem, manajemen hierarki (ltree), dan manajemen pegawai.' 
                      : 'Hanya memiliki akses standar ke menu persuratan sesuai dengan jabatan yang diemban.'}
                  </p>
                </div>
                <Button 
                  onClick={handleToggleRole}
                  variant={user?.role === 'admin' ? 'outline' : 'default'}
                  className={`shrink-0 rounded-xl ${user?.role === 'admin' ? 'border-destructive/30 text-destructive hover:bg-destructive hover:text-white' : 'shadow-md'}`}
                  disabled={updateRoleMutation.isPending}
                >
                  {updateRoleMutation.isPending ? 'Mengubah...' : (user?.role === 'admin' ? 'Cabut Akses' : 'Jadikan Admin')}
                </Button>
              </div>
            </div>
          </div>

          {/* Position Section */}
          <div className="space-y-4">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5" />
              Penempatan Jabatan Utama
            </Label>
            
            <div className="p-5 rounded-2xl border border-black/5 dark:border-white/10 bg-muted/20 space-y-4">
              {user?.role === 'admin' ? (
                <div className="flex flex-col items-center justify-center text-center p-6 bg-destructive/5 rounded-xl border border-destructive/20 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                    <ShieldAlert className="w-6 h-6 text-destructive" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-destructive text-sm">Akses Khusus Sistem Administrator</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-[250px]">
                      Superadmin tidak membutuhkan jabatan struktural untuk mengelola sistem. Posisi hanya digunakan untuk alur persuratan (mail flow).
                    </p>
                  </div>
                  {user.positionId && (
                     <Button 
                     variant="outline" 
                     className="mt-2 w-full rounded-xl border-destructive/30 text-destructive hover:bg-destructive hover:text-white"
                     onClick={handleRemovePosition}
                     disabled={removePositionMutation.isPending}
                   >
                     {removePositionMutation.isPending ? "Menghapus..." : "Cabut Jabatan Saat Ini"}
                   </Button>
                  )}
                </div>
              ) : user?.positionId ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10 shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                      <Network className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {positions?.find(p => p.id === user.positionId)?.title || "Jabatan tidak ditemukan"}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {positions?.find(p => p.id === user.positionId)?.code}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="destructive" 
                    className="w-full rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border border-destructive/20"
                    onClick={handleRemovePosition}
                    disabled={removePositionMutation.isPending}
                  >
                    {removePositionMutation.isPending ? "Menghapus..." : "Lepaskan dari Jabatan"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col gap-2">
                    <select 
                      className="w-full h-11 px-3 py-2 rounded-xl text-sm bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      value={selectedPositionId}
                      onChange={(e) => setSelectedPositionId(e.target.value)}
                      disabled={isLoadingPositions}
                    >
                      <option value="" disabled>
                        {isLoadingPositions ? "Memuat posisi..." : "Pilih jabatan struktural..."}
                      </option>
                      {positions?.map(pos => (
                        <option key={pos.id} value={pos.id}>
                          {pos.title} ({pos.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button 
                    className="w-full rounded-xl shadow-md"
                    onClick={handleAssignPosition}
                    disabled={!selectedPositionId || assignPositionMutation.isPending}
                  >
                    {assignPositionMutation.isPending ? "Menyimpan..." : "Tetapkan Jabatan"}
                  </Button>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </SheetContent>
    </Sheet>
  )
}

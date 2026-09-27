"use client"

import { useState, useMemo } from "react"
import { useTRPC } from "@/trpc/client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Users, Search, UserPlus, Trash2, AlertTriangle, Loader2 } from "lucide-react"
import { UserSidebar, UserItem } from "@/components/admin/user-sidebar"
import { CreateUserDialog } from "@/components/admin/create-user-dialog"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { getColumns } from "./columns"

export default function UsersAdminPage() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all")
  
  const { data: users, isLoading, error } = useQuery(trpc.admin.getUsers.queryOptions())
  const { data: positions } = useQuery(trpc.admin.getPositions.queryOptions())

  // Delete User Mutation
  const deleteUserMutation = useMutation(
    trpc.admin.deleteUser.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [["admin", "getUsers"]] })
        queryClient.invalidateQueries({ queryKey: [["admin", "getUsersByPosition"]] })
        toast.success("Pengguna Dihapus", {
          description: `Akun ${userToDelete?.name} telah dihapus secara permanen dari sistem.`,
        })
        setUserToDelete(null)
      },
      onError: (err) => {
        toast.error("Gagal Menghapus Pengguna", {
          description: err.message || "Terjadi kesalahan saat menghapus pengguna.",
        })
      },
    })
  )

  const handleDeleteConfirm = () => {
    if (!userToDelete) return
    deleteUserMutation.mutate({ id: userToDelete.id })
  }

  // Filter Logic
  const filteredUsers = useMemo(() => {
    if (!users) return []
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (user.nip && user.nip.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesRole = roleFilter === "all" || user.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [users, searchQuery, roleFilter])

  // Create columns with onEdit, onDelete callback, and positions map
  const columns = useMemo(
    () =>
      getColumns(
        (user) => setSelectedUser(user),
        (user) => setUserToDelete(user),
        positions || []
      ),
    [positions]
  )

  return (
    <div className="flex flex-col min-h-full bg-transparent w-full max-w-[1600px] mx-auto pb-12 pt-4">
      {/* Sleek, Compact Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-widest uppercase mb-2 border border-primary/20">
            <Users className="w-3 h-3" />
            Direktori Pengguna
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Manajemen Pengguna
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Kelola akses, data identitas, peran PBAC, dan kredensial pegawai dalam sistem AMS Korporat.
          </p>
        </div>
        
        {/* 2026 UI Search, Filters & Action Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative w-full sm:w-64 group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Cari nama, NIP, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all shadow-sm"
            />
          </div>
          
          {/* Role Filters (Pills) */}
          <div className="flex items-center gap-1.5 p-1 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-full shadow-sm">
            {(["all", "admin", "user"] as const).map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3.5 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-all duration-300 ease-[var(--ease-fluid)] ${
                  roleFilter === role 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              >
                {role === "all" ? "Semua" : role}
              </button>
            ))}
          </div>

          {/* Create User Button */}
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="w-full sm:w-auto h-11 px-5 rounded-full bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center gap-2 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pengguna</span>
          </Button>
        </div>
      </div>

      {/* Table Area */}
      <div className="relative bg-white dark:bg-neutral-900 rounded-[2rem] border border-black/5 dark:border-white/10 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.05)] p-4 md:p-6 lg:p-8">
        <div className="relative z-10 overflow-x-auto">
          {error ? (
            <div className="p-8 rounded-2xl bg-destructive/5 text-destructive border border-destructive/20 text-center font-medium">
              Gagal memuat pengguna: {error.message}
            </div>
          ) : (
            <div className="min-w-[800px]">
              <DataTable 
                columns={columns} 
                data={(filteredUsers as any) || []} 
                isLoading={isLoading}
                page={1}
                pageCount={1}
                onPageChange={() => {}}
              />
            </div>
          )}
        </div>
      </div>

      {/* User Edit & Detail Sheet */}
      <UserSidebar 
        user={selectedUser} 
        onClose={() => setSelectedUser(null)} 
        onDeleteRequest={(user) => {
          setSelectedUser(null)
          setUserToDelete(user)
        }}
      />

      {/* Create User Dialog */}
      <CreateUserDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent className="sm:max-w-md rounded-3xl p-6 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-2xl border border-black/10 dark:border-white/10 shadow-2xl">
          <AlertDialogHeader className="space-y-3 text-left">
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-foreground">
              Konfirmasi Hapus Pengguna
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Apakah Anda yakin ingin menghapus akun <span className="font-bold text-foreground">{userToDelete?.name}</span> ({userToDelete?.email})?
              Tindakan ini akan menghapus sesi login dan kredensial secara permanen dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-4 pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-end gap-2.5">
            <AlertDialogCancel disabled={deleteUserMutation.isPending} className="rounded-xl h-10 px-4 text-xs font-semibold">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteUserMutation.isPending}
              className="rounded-xl h-10 px-5 text-xs font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md flex items-center gap-1.5"
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Permanen
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

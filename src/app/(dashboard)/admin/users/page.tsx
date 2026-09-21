"use client"

import { useState, useMemo } from "react"
import { useTRPC } from "@/trpc/client"
import { useQuery } from "@tanstack/react-query"
import { Users, Search, Filter } from "lucide-react"
import { UserSidebar, UserItem } from "@/components/admin/user-sidebar"
import { DataTable } from "@/components/ui/data-table"
import { getColumns } from "./columns"

export default function UsersAdminPage() {
  const trpc = useTRPC()
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all")
  
  const { data: users, isLoading, error } = useQuery(trpc.admin.getUsers.queryOptions())
  const { data: positions } = useQuery(trpc.admin.getPositions.queryOptions())

  // Filter Logic
  const filteredUsers = useMemo(() => {
    if (!users) return []
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            user.email.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesRole = roleFilter === "all" || user.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [users, searchQuery, roleFilter])

  // Create columns with the onEdit callback and positions map
  const columns = useMemo(() => getColumns((user) => setSelectedUser(user), positions || []), [positions])

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
            Kelola akses, peran, dan delegasi jabatan struktural pegawai dalam sistem.
          </p>
        </div>
        
        {/* 2026 UI Search & Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative w-full sm:w-72 group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Cari nama atau email..."
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
                className={`px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-all duration-300 ease-[var(--ease-fluid)] ${
                  roleFilter === role 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              >
                {role === "all" ? "Semua" : role}
              </button>
            ))}
          </div>
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

      <UserSidebar user={selectedUser} onClose={() => setSelectedUser(null)} />
    </div>
  )
}

"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { UserItem } from "@/components/admin/user-sidebar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Edit2, Network, MoreHorizontal, Trash2, Shield, Briefcase } from "lucide-react"

export const getColumns = (
  onEdit: (user: UserItem) => void,
  onDelete: (user: UserItem) => void,
  positions: any[] = []
): ColumnDef<UserItem>[] => [
  {
    accessorKey: "name",
    header: "Nama Pegawai",
    cell: ({ row }) => {
      const user = row.original
      const initials = (user.name || "U")
        .split(" ")
        .map((n) => n[0] || "")
        .slice(0, 2)
        .join("")
        .toUpperCase()

      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
            {initials}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-foreground text-sm truncate">{user.name}</span>
            {user.nip && (
              <span className="text-[11px] font-mono text-muted-foreground">
                NIP: {user.nip}
              </span>
            )}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm font-normal">
        {row.getValue("email")}
      </span>
    ),
  },
  {
    accessorKey: "role",
    header: "Role Akses",
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      return (
        <Badge
          variant={role === "admin" ? "destructive" : "secondary"}
          className="uppercase font-bold tracking-widest text-[10px] rounded-full px-2.5 py-0.5"
        >
          {role === "admin" ? "Superadmin" : "User"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "positionId",
    header: "Posisi Struktural",
    cell: ({ row }) => {
      const posId = row.getValue("positionId") as string
      const role = row.getValue("role") as string
      const pos = positions.find((p) => p.id === posId)

      if (role === "admin" && !posId) {
        return (
          <span className="text-muted-foreground font-medium text-xs flex items-center gap-2 bg-destructive/5 text-destructive px-2.5 py-1 rounded-full w-fit border border-destructive/20">
            <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
            Sistem Administrator
          </span>
        )
      }

      return posId ? (
        <div className="flex items-start gap-2.5">
          <Network className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate text-foreground text-xs">{pos?.title || posId}</p>
            {pos?.code && <p className="text-[10px] font-mono text-muted-foreground">{pos.code}</p>}
          </div>
        </div>
      ) : (
        <span className="text-muted-foreground italic text-xs flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
          Non-Struktural
        </span>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original

      return (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(user)}
            className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors text-xs font-semibold h-8 px-3"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1.5" />
            Detail & Edit
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus:outline-none"
                  aria-label="Aksi Lainnya"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              }
            />
            <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-xl shadow-xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-2xl">
              <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                Aksi Pengguna
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => onEdit(user)}
                className="flex items-center gap-2 text-xs py-2 px-2 rounded-lg cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-primary" />
                <span>Ubah Profil / Sandi</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onEdit(user)}
                className="flex items-center gap-2 text-xs py-2 px-2 rounded-lg cursor-pointer"
              >
                <Briefcase className="w-3.5 h-3.5 text-primary" />
                <span>Atur Jabatan PBAC</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-black/5 dark:border-white/5" />
              <DropdownMenuItem
                onClick={() => onDelete(user)}
                className="flex items-center gap-2 text-xs py-2 px-2 rounded-lg text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Pengguna</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]

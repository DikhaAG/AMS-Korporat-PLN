"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { UserItem } from "@/components/admin/user-sidebar"
import { Button } from "@/components/ui/button"
import { Edit2, Network } from "lucide-react"

export const getColumns = (
  onEdit: (user: UserItem) => void,
  positions: any[] = []
): ColumnDef<UserItem>[] => [
  {
    accessorKey: "name",
    header: "Nama Pegawai",
    cell: ({ row }) => (
      <div className="font-semibold text-foreground flex items-center gap-2">
        {row.getValue("name")}
      </div>
    )
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role Akses",
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      return (
        <Badge variant={role === "admin" ? "destructive" : "secondary"} className="uppercase font-bold tracking-widest text-[10px]">
          {role || "USER"}
        </Badge>
      )
    }
  },
  {
    accessorKey: "positionId",
    header: "Posisi",
    cell: ({ row }) => {
      const posId = row.getValue("positionId") as string
      const role = row.getValue("role") as string
      const pos = positions.find(p => p.id === posId)
      
      if (role === "admin" && !posId) {
        return (
          <span className="text-muted-foreground font-medium text-xs flex items-center gap-2 bg-destructive/5 text-destructive px-2.5 py-1 rounded-full w-fit border border-destructive/20">
            <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
            Sistem Administrator
          </span>
        )
      }

      return posId ? (
        <div className="flex items-start gap-3">
          <Network className="w-4 h-4 shrink-0 mt-0.5 text-orange-500" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate text-foreground">{pos?.title || posId}</p>
            {pos?.code && <p className="text-[10px] font-mono mt-0.5 opacity-70">{pos.code}</p>}
          </div>
        </div>
      ) : (
        <span className="text-muted-foreground italic text-xs flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
          Belum di-assign
        </span>
      )
    }
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => onEdit(row.original)} 
        className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
      >
        <Edit2 className="w-4 h-4 mr-2" />
        Edit
      </Button>
    ),
  },
]

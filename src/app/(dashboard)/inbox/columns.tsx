"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Star, Mail, Reply, Paperclip, AlertCircle } from "lucide-react"

export type Document = {
  id: string
  documentNumber: string | null
  subject: string
  documentType: string
  currentStatus: string
  securityLevel: string
  createdAt: string
  updatedAt: string
  senderPositionTitle?: string | null
  senderPositionCode?: string | null
}

import Link from "next/link"

export const columns: ColumnDef<Document>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "no",
    header: "No",
    cell: ({ row, table }) => {
      const index = row.index + 1
      return <div className="text-center font-mono text-xs">{index}</div>
    }
  },
  {
    accessorKey: "documentNumber",
    header: "Nomor Nota Dinas",
    cell: ({ row }) => {
      const num = row.getValue("documentNumber") as string
      return (
        <div className="flex items-center gap-2">
          {row.index === 0 && <AlertCircle className="w-4 h-4 text-destructive shrink-0" />}
          <Link 
            href={`/document/${row.original.id}`} 
            className="font-bold text-xs sm:text-sm text-[#145f74] hover:underline flex items-center gap-1.5"
          >
            {num || "DRAFT"}
          </Link>
        </div>
      )
    }
  },
  {
    id: "dari",
    header: "Dari",
    cell: ({ row }) => {
      const title = row.original.senderPositionTitle || "System"
      const code = row.original.senderPositionCode
      return (
        <div className="flex flex-col">
          <span className="font-semibold text-xs sm:text-sm truncate max-w-[180px]" title={title}>{title}</span>
          {code && <span className="text-[10px] text-muted-foreground">{code}</span>}
        </div>
      )
    }
  },
  {
    accessorKey: "subject",
    header: "Hal",
    cell: ({ row }) => {
      return (
        <Link 
          href={`/document/${row.original.id}`}
          className="hover:text-[#145f74] hover:underline font-medium text-xs sm:text-sm line-clamp-2 block"
        >
          {row.getValue("subject")}
        </Link>
      )
    }
  },
  {
    accessorKey: "createdAt",
    header: "Tgl Nota Dinas",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"))
      return <div className="text-xs">{date.toLocaleDateString("id-ID")}</div>
    }
  },
  {
    id: "tglTerima",
    header: "Tgl Terima",
    cell: ({ row }) => {
      const date = new Date(row.original.updatedAt || row.original.createdAt)
      return <div className="text-xs text-muted-foreground">{date.toLocaleDateString("id-ID")}</div>
    }
  },
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-primary"><Star className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-primary"><Mail className="h-3.5 w-3.5" /></Button>
          <Link href={`/document/${row.original.id}`} title="Buka Detail & Disposisi">
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-[#145f74] hover:bg-[#145f74]/10">
              <Reply className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-primary"><Paperclip className="h-3.5 w-3.5" /></Button>
        </div>
      )
    }
  },
]

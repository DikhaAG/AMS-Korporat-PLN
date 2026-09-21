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
      return <div className="text-center">{index}</div>
    }
  },
  {
    accessorKey: "documentNumber",
    header: "Nomor Nota Dinas",
    cell: ({ row }) => {
      const num = row.getValue("documentNumber") as string
      // Render as a teal link
      return (
        <div className="flex items-center gap-2">
          {row.index === 0 && <AlertCircle className="w-4 h-4 text-destructive shrink-0" />}
          <a href={`/document/${row.original.id}`} className="font-medium text-[#145f74] hover:underline">
            {num || "DRAFT"}
          </a>
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
          <span className="font-semibold text-sm truncate max-w-[180px]" title={title}>{title}</span>
          {code && <span className="text-xs text-muted-foreground">{code}</span>}
        </div>
      )
    }
  },
  {
    accessorKey: "subject",
    header: "Hal",
  },
  {
    accessorKey: "createdAt",
    header: "Tgl Nota Dinas",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"))
      return <div>{date.toLocaleDateString("id-ID")}</div>
    }
  },
  {
    id: "tglTerima",
    header: "Tgl Terima",
    cell: ({ row }) => {
      // updatedAt indicates when it last transitioned state (e.g. into INBOX/SIGNED)
      const date = new Date(row.original.updatedAt || row.original.createdAt)
      return <div>{date.toLocaleDateString("id-ID")}</div>
    }
  },
  {
    id: "actions",
    header: "Action",
    cell: () => {
      return (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary"><Star className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary"><Mail className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary"><Reply className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary"><Paperclip className="h-4 w-4" /></Button>
        </div>
      )
    }
  },
]

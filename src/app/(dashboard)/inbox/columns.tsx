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
import { Eye, ExternalLink } from "lucide-react"

export function createColumns(onPreview?: (doc: Document) => void): ColumnDef<Document>[] {
  return [
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
      cell: ({ row }) => {
        const index = row.index + 1
        return <div className="text-center font-mono text-xs text-muted-foreground">{index}</div>
      }
    },
    {
      accessorKey: "documentNumber",
      header: "Nomor Nota Dinas",
      cell: ({ row }) => {
        const num = row.getValue("documentNumber") as string
        const isDraft = !num || num === "DRAFT"
        return (
          <div className="flex items-center gap-2">
            {row.original.currentStatus === "IN_REVIEW" && (
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" title="Menunggu Reviu / Paraf" />
            )}
            {onPreview ? (
              <button
                type="button"
                onClick={() => onPreview(row.original)}
                className="font-bold text-xs sm:text-sm text-[#145f74] hover:underline flex items-center gap-1.5 text-left cursor-pointer"
              >
                {num || "DRAFT"}
              </button>
            ) : (
              <Link 
                href={`/document/${row.original.id}`} 
                className="font-bold text-xs sm:text-sm text-[#145f74] hover:underline flex items-center gap-1.5"
              >
                {num || "DRAFT"}
              </Link>
            )}
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
            {code && <span className="text-[10px] text-muted-foreground font-mono">{code}</span>}
          </div>
        )
      }
    },
    {
      accessorKey: "subject",
      header: "Hal",
      cell: ({ row }) => {
        if (onPreview) {
          return (
            <button
              type="button"
              onClick={() => onPreview(row.original)}
              className="hover:text-[#145f74] hover:underline font-medium text-xs sm:text-sm line-clamp-2 block text-left cursor-pointer"
            >
              {row.getValue("subject")}
            </button>
          )
        }
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
      accessorKey: "currentStatus",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.currentStatus
        return (
          <Badge
            variant="outline"
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              status === "SIGNED_AND_PUBLISHED"
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                : status === "IN_REVIEW"
                ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                : status === "NEEDS_REVISION"
                ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {status}
          </Badge>
        )
      }
    },
    {
      accessorKey: "createdAt",
      header: "Tgl Nota Dinas",
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"))
        return <div className="text-xs text-muted-foreground">{date.toLocaleDateString("id-ID")}</div>
      }
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-1 text-muted-foreground">
            {onPreview && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onPreview(row.original)}
                className="h-8 w-8 hover:text-[#145f74] hover:bg-[#145f74]/10 rounded-lg"
                title="Quick Drawer Preview (Pratinjau Cepat)"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            <Link href={`/document/${row.original.id}`} title="Buka Halaman Lengkap">
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-[#145f74] hover:bg-[#145f74]/10 rounded-lg">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        )
      }
    },
  ]
}

export const columns: ColumnDef<Document>[] = createColumns()


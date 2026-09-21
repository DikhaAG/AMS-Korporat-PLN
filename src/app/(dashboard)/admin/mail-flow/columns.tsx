"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export type MailFlow = {
  id: string;
  documentNumber: string | null;
  subject: string;
  currentStatus: string;
  classificationCode: string | null;
  urgencyLevel: string;
  senderPosition: string | null;
  createdAt: Date;
};

const statusMap: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "bg-muted text-muted-foreground" },
  IN_REVIEW: { label: "Diperiksa", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  NEEDS_REVISION: { label: "Revisi", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  APPROVED: { label: "Disetujui", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  SIGNED_AND_PUBLISHED: { label: "Terbit", color: "bg-emerald-500 text-white" },
  REJECTED: { label: "Ditolak", color: "bg-destructive/10 text-destructive border-destructive/20" },
  CANCELLED: { label: "Batal", color: "bg-muted text-muted-foreground" },
};

const urgencyMap: Record<string, { label: string; color: string }> = {
  REGULAR: { label: "Biasa", color: "bg-muted text-muted-foreground" },
  URGENT: { label: "Penting", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  FLASH: { label: "Segera", color: "bg-destructive/10 text-destructive border-destructive/20" },
};

export const columns: ColumnDef<MailFlow>[] = [
  {
    accessorKey: "documentNumber",
    header: "Nomor Dokumen",
    cell: ({ row }) => {
      const num = row.getValue("documentNumber") as string;
      return <span className="font-mono text-sm font-semibold">{num || "Belum Terbit"}</span>;
    },
  },
  {
    accessorKey: "subject",
    header: "Perihal",
    cell: ({ row }) => {
      const subject = row.getValue("subject") as string;
      return <span className="truncate max-w-[250px] block font-medium" title={subject}>{subject}</span>;
    },
  },
  {
    accessorKey: "senderPosition",
    header: "Pengirim",
    cell: ({ row }) => {
      return <span>{row.getValue("senderPosition") || "-"}</span>;
    },
  },
  {
    accessorKey: "currentStatus",
    header: "Status",
    cell: ({ row }) => {
      const statusStr = row.getValue("currentStatus") as string;
      const status = statusMap[statusStr] || { label: statusStr, color: "bg-muted text-muted-foreground" };
      return (
        <Badge variant="outline" className={status.color}>
          {status.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "urgencyLevel",
    header: "Urgensi",
    cell: ({ row }) => {
      const urgencyStr = row.getValue("urgencyLevel") as string;
      const urgency = urgencyMap[urgencyStr] || { label: urgencyStr, color: "bg-muted text-muted-foreground" };
      return (
        <Badge variant="outline" className={urgency.color}>
          {urgency.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Tgl Buat",
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date;
      return <span className="text-sm text-muted-foreground">{format(date, "dd MMM yyyy")}</span>;
    },
  },
];

"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export type ActivityLog = {
  id: number;
  eventType: string;
  createdAt: Date;
  actorName: string | null;
  actorEmail: string | null;
  documentSubject: string | null;
};

export const columns: ColumnDef<ActivityLog>[] = [
  {
    accessorKey: "actorName",
    header: "Aktor",
    cell: ({ row }) => {
      const name = row.getValue("actorName") as string;
      const email = row.original.actorEmail;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{name || "System"}</span>
          {email && <span className="text-xs text-muted-foreground">{email}</span>}
        </div>
      );
    },
  },
  {
    accessorKey: "eventType",
    header: "Event",
    cell: ({ row }) => {
      const type = row.getValue("eventType") as string;
      return <Badge variant="outline" className="capitalize">{type.replace(/_/g, " ").toLowerCase()}</Badge>;
    },
  },
  {
    accessorKey: "documentSubject",
    header: "Dokumen",
    cell: ({ row }) => {
      const subject = row.getValue("documentSubject") as string;
      return <span className="truncate max-w-[300px] block" title={subject}>{subject || "-"}</span>;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Waktu",
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date;
      return <span className="text-sm">{format(date, "dd MMM yyyy, HH:mm")}</span>;
    },
  },
];

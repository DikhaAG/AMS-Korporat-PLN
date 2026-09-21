"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="w-full flex flex-col gap-3">
      {/* List Header */}
      <div className="flex items-center px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest bg-muted/20 rounded-2xl border border-border/50 backdrop-blur-sm sticky top-0 z-20">
        {table.getHeaderGroups().map((headerGroup) => (
          <div key={headerGroup.id} className="flex w-full items-center">
            {headerGroup.headers.map((header, index) => {
              // Quick proportional sizing based on index
              const flexBasis = index === 0 ? "40px" : index === 1 ? "60px" : index === 2 ? "200px" : index === 3 ? "120px" : index === 4 ? "flex-1" : index === 5 ? "120px" : index === 6 ? "120px" : "150px";
              return (
                <div key={header.id} style={{ flexBasis, minWidth: flexBasis }} className="px-2 shrink-0">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* List Body */}
      <div className="flex flex-col gap-2 relative z-10 pb-20">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row, i) => (
            <div
              key={row.id}
              className="flex w-full items-center px-4 py-4 bg-white dark:bg-neutral-900 rounded-2xl border border-black/5 dark:border-white/5 transition-all duration-500 ease-[var(--ease-fluid)] hover:shadow-ambient hover:scale-[1.01] hover:z-20 relative group"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {row.getVisibleCells().map((cell, index) => {
                const flexBasis = index === 0 ? "40px" : index === 1 ? "60px" : index === 2 ? "200px" : index === 3 ? "120px" : index === 4 ? "flex-1" : index === 5 ? "120px" : index === 6 ? "120px" : "150px";
                return (
                  <div key={cell.id} style={{ flexBasis, minWidth: flexBasis }} className="px-2 shrink-0 truncate">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                )
              })}
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-48 bg-white/50 rounded-2xl border border-dashed border-border text-muted-foreground font-medium">
            No results.
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { useQueryState, parseAsString, parseAsStringEnum } from 'nuqs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'
import { DocumentStatusEnum } from '@/shared/schemas/document'

export function InboxFilters() {
  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''))
  const [status, setStatus] = useQueryState('status', parseAsString)

  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Cari perihal naskah..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-full bg-white/5 border-border/50 shadow-inner-glow focus-visible:ring-1 focus-visible:ring-primary/50 transition-all"
        />
      </div>
      <Select value={status || "ALL"} onValueChange={(val) => setStatus(val === "ALL" ? null : val)}>
        <SelectTrigger className="w-[180px] rounded-full bg-white/5 border-border/50 shadow-inner-glow">
          <SelectValue placeholder="Status Naskah" />
        </SelectTrigger>
        <SelectContent className="rounded-xl shadow-ambient border-border/50">
          <SelectItem value="ALL">Semua Status</SelectItem>
          <SelectItem value="DRAFT">Draft</SelectItem>
          <SelectItem value="IN_REVIEW">Sedang Direviu</SelectItem>
          <SelectItem value="SIGNED_AND_PUBLISHED">Terkirim / Sah</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

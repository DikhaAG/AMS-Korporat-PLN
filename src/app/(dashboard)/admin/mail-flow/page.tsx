"use client";

import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { Mail, CheckCircle2, Clock, FileText, Search, CalendarIcon, FilterX } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function MailFlowPage() {
  const trpc = useTRPC();

  // State Management with URL
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", parseAsString.withDefault(""));
  const [sender, setSender] = useQueryState("sender", parseAsString.withDefault("all"));
  const [status, setStatus] = useQueryState("status", parseAsString.withDefault("all"));
  const [urgency, setUrgency] = useQueryState("urgency", parseAsString.withDefault("all"));
  const [date, setDate] = useQueryState("date", parseAsString.withDefault(""));

  // Fetch Data
  const { data, isLoading } = useQuery({
    ...trpc.admin.getGlobalMailFlow.queryOptions(),
    staleTime: 30000,
  });

  const { data: positions } = useQuery({
    ...trpc.admin.getPositions.queryOptions(),
    staleTime: 60000,
  });

  const PAGE_SIZE = 10;
  const safeData = data || [];

  // Filter Data
  let filteredData = safeData;

  if (search) {
    const q = search.toLowerCase();
    filteredData = filteredData.filter(d =>
      (d.subject?.toLowerCase().includes(q)) ||
      (d.documentNumber?.toLowerCase().includes(q))
    );
  }

  if (sender && sender !== "all") {
    filteredData = filteredData.filter(d => d.senderPosition === sender);
  }

  if (status && status !== "all") {
    filteredData = filteredData.filter(d => d.currentStatus === status);
  }

  if (urgency && urgency !== "all") {
    filteredData = filteredData.filter(d => d.urgencyLevel === urgency);
  }

  if (date) {
    filteredData = filteredData.filter(d => {
      if (!d.createdAt) return false;
      const docDate = new Date(d.createdAt).toISOString().split('T')[0];
      return docDate === date;
    });
  }

  const pageCount = Math.ceil(filteredData.length / PAGE_SIZE);
  const paginatedData = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Quick stats (always based on unfiltered data to show global totals, or filtered? Usually global is better for dashboard context, but here let's keep global for consistency with previous implementation)
  const totalDrafts = safeData.filter(d => d.currentStatus === "DRAFT").length;
  const totalInReview = safeData.filter(d => d.currentStatus === "IN_REVIEW").length;
  const totalPublished = safeData.filter(d => d.currentStatus === "SIGNED_AND_PUBLISHED").length;

  const hasActiveFilters = search || sender !== "all" || status !== "all" || urgency !== "all" || date;

  const handleResetFilters = () => {
    setSearch("");
    setSender("all");
    setStatus("all");
    setUrgency("all");
    setDate("");
    setPage(1);
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 w-full max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-blue-600">
          <Mail className="w-6 h-6" />
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Alur Naskah Dinas</h2>
        </div>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Pantau secara real-time pergerakan naskah dinas masuk dan keluar lintas departemen dengan analitik komprehensif.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span className="font-medium text-sm">Draft Aktif</span>
          </div>
          <span className="text-3xl font-bold">{totalDrafts}</span>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2">
          <div className="flex items-center gap-2 text-blue-500">
            <Clock className="w-4 h-4" />
            <span className="font-medium text-sm">Sedang Diperiksa</span>
          </div>
          <span className="text-3xl font-bold">{totalInReview}</span>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2">
          <div className="flex items-center gap-2 text-emerald-500">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-medium text-sm">Naskah Terbit</span>
          </div>
          <span className="text-3xl font-bold">{totalPublished}</span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Pro Max Filter Bar */}
        <div className="bg-card border border-border/40 shadow-sm p-4 rounded-xl flex flex-col xl:flex-row gap-4 items-center justify-between">
          <div className="relative w-full xl:max-w-xs shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari no. dokumen / perihal..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value || "");
                setPage(1);
              }}
              className="pl-9 h-10 bg-background/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto xl:justify-end">
            <Select value={sender} onValueChange={(v) => { setSender(v); setPage(1); }}>
              <SelectTrigger className="w-[180px] h-10 bg-background/50">
                <SelectValue placeholder="Pengirim" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Pengirim</SelectItem>
                {positions?.map(pos => (
                  <SelectItem key={pos.id} value={pos.title}>{pos.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[150px] h-10 bg-background/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="IN_REVIEW">Diperiksa</SelectItem>
                <SelectItem value="NEEDS_REVISION">Revisi</SelectItem>
                <SelectItem value="APPROVED">Disetujui</SelectItem>
                <SelectItem value="SIGNED_AND_PUBLISHED">Terbit</SelectItem>
                <SelectItem value="REJECTED">Ditolak</SelectItem>
                <SelectItem value="CANCELLED">Batal</SelectItem>
              </SelectContent>
            </Select>

            <Select value={urgency} onValueChange={(v) => { setUrgency(v); setPage(1); }}>
              <SelectTrigger className="w-[140px] h-10 bg-background/50">
                <SelectValue placeholder="Urgensi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Urgensi</SelectItem>
                <SelectItem value="REGULAR">Biasa</SelectItem>
                <SelectItem value="URGENT">Penting</SelectItem>
                <SelectItem value="FLASH">Segera</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger render={
                <Button
                  variant="outline"
                  className={cn(
                    "w-[160px] h-10 justify-start text-left font-normal bg-background/50",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(new Date(date), "dd MMM yyyy") : <span>Pilih Tanggal</span>}
                </Button>
              }>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={date ? new Date(date) : undefined}
                  onSelect={(d) => {
                    setDate(d ? format(d, "yyyy-MM-dd") : "");
                    setPage(1);
                  }}
                />
              </PopoverContent>
            </Popover>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleResetFilters}
                title="Reset Filters"
                className="h-10 w-10 text-muted-foreground hover:text-destructive transition-colors"
              >
                <FilterX className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        <div className="bg-card border border-border/40 shadow-sm p-1 rounded-xl">
          <DataTable
            columns={columns}
            data={paginatedData}
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}

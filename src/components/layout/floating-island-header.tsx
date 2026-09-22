"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useSession, signOut } from "@/lib/auth-client"
import { useTRPC } from "@/trpc/client"
import { useQuery } from "@tanstack/react-query"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Bell,
  User,
  LogOut,
  Shield,
  ShieldAlert,
  Network,
  BadgeCheck,
  FilePlus,
  Inbox,
  ChevronDown,
  Sparkles,
  CheckCircle2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

function getPageTitle(pathname: string): { module: string; sub?: string } {
  if (pathname === "/inbox") return { module: "Surat Masuk", sub: "Kotak Masuk" }
  if (pathname === "/inbox/terkirim") return { module: "Surat Masuk", sub: "Terkirim" }
  if (pathname === "/outbox/persetujuan") return { module: "Surat Keluar", sub: "Persetujuan" }
  if (pathname === "/outbox/telusuri") return { module: "Surat Keluar", sub: "Telusuri" }
  if (pathname === "/outbox/konsep") return { module: "Surat Keluar", sub: "Konsep" }
  if (pathname === "/outbox/terkirim") return { module: "Surat Keluar", sub: "Terkirim" }
  if (pathname === "/outbox/dibatalkan") return { module: "Surat Keluar", sub: "Dibatalkan" }
  if (pathname === "/nota-dinas") return { module: "Nota Dinas", sub: "Beranda" }
  if (pathname === "/nota-dinas/persetujuan") return { module: "Nota Dinas", sub: "Persetujuan" }
  if (pathname === "/nota-dinas/konsep") return { module: "Nota Dinas", sub: "Konsep" }
  if (pathname === "/nota-dinas/telusuri") return { module: "Nota Dinas", sub: "Telusuri" }
  if (pathname === "/nota-dinas/terkirim") return { module: "Nota Dinas", sub: "Terkirim" }
  if (pathname === "/nota-dinas/dibatalkan") return { module: "Nota Dinas", sub: "Dibatalkan" }
  if (pathname === "/gabungan") return { module: "Naskah Gabungan", sub: "Daftar" }
  if (pathname === "/composer") return { module: "Editor", sub: "Buat Naskah" }
  if (pathname === "/admin") return { module: "Superadmin", sub: "Ringkasan" }
  if (pathname === "/admin/users") return { module: "Superadmin", sub: "Manajemen Pengguna" }
  if (pathname === "/admin/positions") return { module: "Superadmin", sub: "Struktur Posisi" }
  if (pathname === "/admin/mail-flow") return { module: "Superadmin", sub: "Arus Persuratan" }
  if (pathname === "/admin/settings") return { module: "Superadmin", sub: "Pengaturan" }
  if (pathname.startsWith("/documents/")) return { module: "Naskah", sub: "Detail Dokumen" }
  return { module: "AMS Korporat", sub: "Portal" }
}

export function FloatingIslandHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const trpc = useTRPC()
  const { data: sessionData, isPending: isSessionPending } = useSession()

  // Fetch full dynamic profile with structural position and pending count
  const { data: profile } = useQuery(
    trpc.user.getProfile.queryOptions(undefined, {
      enabled: !!sessionData?.user,
      staleTime: 1000 * 30, // 30 seconds
    })
  )

  const user = profile || (sessionData?.user as any)
  const isAdmin = user?.role === "admin"
  const nip = user?.nip
  const pageInfo = getPageTitle(pathname)
  const pendingCount = profile?.pendingCount || 0

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  const userName: string = user?.name || "User"
  const initials = userName
    .split(" ")
    .map((n: string) => n[0] || "")
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className="absolute top-5 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <header className="pointer-events-auto flex h-14 shrink-0 items-center gap-3 md:gap-4 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl border border-black/5 dark:border-white/10 text-foreground px-3.5 md:px-4 rounded-full shadow-[0_8px_32px_-12px_rgba(0,0,0,0.12)] transition-all duration-700 ease-[var(--ease-fluid)]">
        {/* Sidebar Trigger */}
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground rounded-full h-8 w-8 transition-colors" />

        {/* Dynamic Brand & Route Pill */}
        <div className="flex items-center gap-2">
          <Link
            href="/inbox"
            className="flex items-center gap-1.5 font-bold text-xs md:text-sm tracking-widest text-primary uppercase transition-opacity hover:opacity-80"
          >
            <span className="hidden sm:inline">AMS</span> Korporat
          </Link>

          <span className="text-black/20 dark:text-white/20 font-light text-xs">/</span>

          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/5 text-[11px] font-medium text-muted-foreground">
            <span className="font-semibold text-foreground truncate max-w-[110px] md:max-w-[160px]">
              {pageInfo.module}
            </span>
            {pageInfo.sub && (
              <>
                <span className="opacity-40">•</span>
                <span className="hidden sm:inline truncate max-w-[120px]">{pageInfo.sub}</span>
              </>
            )}
          </div>
        </div>

        {/* Spacer */}
        <div className="w-2 md:w-16 flex-1 md:flex-initial" />

        {/* Right Actions: Notifications & User Profile */}
        <div className="flex items-center gap-2">
          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  className="relative p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-foreground focus:outline-none"
                  aria-label="Notifikasi"
                >
                  <Bell className="h-4 w-4" />
                  {pendingCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                    </span>
                  )}
                </button>
              }
            />
            <DropdownMenuContent align="end" className="w-72 p-2 rounded-2xl shadow-xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl">
              <div className="px-3 py-2 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">Notifikasi Sistem</span>
                {pendingCount > 0 ? (
                  <Badge variant="default" className="text-[10px] px-2 py-0 h-4 bg-primary">
                    {pendingCount} Menunggu
                  </Badge>
                ) : (
                  <span className="text-[11px] text-muted-foreground">Semua bersih</span>
                )}
              </div>
              <div className="py-2 px-1 text-xs space-y-1">
                {pendingCount > 0 ? (
                  <Link
                    href="/outbox/persetujuan"
                    className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-muted/60 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">Persetujuan Naskah</p>
                      <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                        Ada {pendingCount} dokumen menunggu paraf / tanda tangan Anda.
                      </p>
                    </div>
                  </Link>
                ) : (
                  <div className="p-4 text-center text-muted-foreground text-xs">
                    Tidak ada persetujuan yang tertunda saat ini.
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dynamic User Profile Dropdown Capsule */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="flex items-center gap-2 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 p-1 md:pr-3 rounded-full transition-all duration-300 ease-[var(--ease-fluid)] group border border-transparent hover:border-black/5 dark:hover:border-white/5 focus:outline-none"
                >
                  <Avatar className="h-7 w-7 border border-primary/20 shadow-sm group-hover:scale-105 transition-transform">
                    <AvatarImage src={user?.image || undefined} alt={user?.name || "User"} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="hidden md:flex flex-col items-start text-left min-w-0">
                    <span className="text-xs font-bold text-foreground truncate max-w-[130px] leading-tight">
                      {user?.name || (isSessionPending ? "Memuat..." : "Pengguna")}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[130px]">
                      {isAdmin ? "Superadmin" : (profile?.position?.code || profile?.position?.title || "Staff PLN")}
                    </span>
                  </div>

                  <ChevronDown className="h-3 w-3 text-muted-foreground opacity-60 group-hover:opacity-100 hidden md:inline-block transition-opacity" />
                </button>
              }
            />

            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-72 p-2 rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-3xl"
            >
              {/* Profile Card Header */}
              <div className="p-3 bg-muted/40 rounded-xl mb-1 border border-black/5 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-primary/20">
                    <AvatarImage src={user?.image || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    {nip && (
                      <p className="text-[10px] font-mono text-primary font-semibold mt-0.5">
                        NIP: {nip}
                      </p>
                    )}
                  </div>
                </div>

                {/* Position / Role Pill */}
                <div className="mt-3 pt-2.5 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    {isAdmin ? <ShieldAlert className="w-3 h-3 text-destructive" /> : <Network className="w-3 h-3 text-primary" />}
                    {isAdmin ? "Role Sistem" : "Jabatan Struktural"}
                  </span>
                  <Badge
                    variant={isAdmin ? "destructive" : "secondary"}
                    className="text-[10px] font-bold px-2 py-0 uppercase"
                  >
                    {isAdmin ? "Super Administrator" : (profile?.position?.code || "Pegawai")}
                  </Badge>
                </div>
              </div>

              {/* Navigation Items */}
              <DropdownMenuGroup className="py-1">
                <DropdownMenuItem
                  render={
                    <Link href="/composer" className="flex items-center gap-2.5 w-full cursor-pointer py-2 px-2.5 rounded-lg text-xs font-medium">
                      <FilePlus className="w-4 h-4 text-primary" />
                      <span>Buat Naskah Dinas</span>
                    </Link>
                  }
                />
                <DropdownMenuItem
                  render={
                    <Link href="/inbox" className="flex items-center gap-2.5 w-full cursor-pointer py-2 px-2.5 rounded-lg text-xs font-medium">
                      <Inbox className="w-4 h-4 text-primary" />
                      <span>Kotak Masuk Persuratan</span>
                    </Link>
                  }
                />
                {isAdmin && (
                  <DropdownMenuItem
                    render={
                      <Link href="/admin" className="flex items-center gap-2.5 w-full cursor-pointer py-2 px-2.5 rounded-lg text-xs font-medium text-destructive focus:text-destructive">
                        <Shield className="w-4 h-4" />
                        <span>Panel Superadmin</span>
                      </Link>
                    }
                  />
                )}
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="my-1 bg-black/5 dark:bg-white/5" />

              {/* Logout */}
              <DropdownMenuItem
                onClick={handleSignOut}
                className="flex items-center gap-2.5 py-2 px-2.5 rounded-lg text-xs font-medium text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar dari Akun</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </div>
  )
}

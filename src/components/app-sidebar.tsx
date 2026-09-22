"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useSession, signOut } from "@/lib/auth-client"
import { useTRPC } from "@/trpc/client"
import { useQuery } from "@tanstack/react-query"
import {
  Inbox,
  Send,
  FileText,
  Search,
  CheckCircle,
  XCircle,
  Plus,
  FolderOpen,
  ArrowRight,
  ShieldAlert,
  Users,
  Network,
  Activity,
  Settings,
  LogOut,
  User,
  ChevronsUpDown,
  FilePlus,
  BadgeCheck,
  Bell,
  Sparkles,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface NavItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  badgeType?: "pending" | "inbox"
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: "SURAT MASUK",
    items: [
      { title: "Surat Masuk", url: "/inbox", icon: Inbox },
      { title: "Terkirim", url: "/inbox/terkirim", icon: Send },
    ],
  },
  {
    label: "SURAT KELUAR",
    items: [
      { title: "Persetujuan", url: "/outbox/persetujuan", icon: CheckCircle, badgeType: "pending" },
      { title: "Telusuri", url: "/outbox/telusuri", icon: Search },
      { title: "Konsep", url: "/outbox/konsep", icon: FileText },
      { title: "Terkirim", url: "/outbox/terkirim", icon: Send },
      { title: "Dibatalkan", url: "/outbox/dibatalkan", icon: XCircle },
    ],
  },
  {
    label: "NOTA DINAS",
    items: [
      { title: "Nota Dinas", url: "/nota-dinas", icon: FolderOpen },
      { title: "Persetujuan", url: "/nota-dinas/persetujuan", icon: CheckCircle, badgeType: "pending" },
      { title: "Telusuri", url: "/nota-dinas/telusuri", icon: Search },
      { title: "Konsep", url: "/nota-dinas/konsep", icon: FileText },
      { title: "Terkirim", url: "/nota-dinas/terkirim", icon: Send },
      { title: "Dibatalkan", url: "/nota-dinas/dibatalkan", icon: XCircle },
    ],
  },
  {
    label: "NASKAH DINAS GABUNGAN",
    items: [
      { title: "Naskah Dinas Gabungan", url: "/gabungan", icon: FolderOpen },
      { title: "Persetujuan", url: "/gabungan/persetujuan", icon: CheckCircle },
      { title: "Terkirim", url: "/gabungan/terkirim", icon: Send },
    ],
  },
]

const adminNavItems = [
  { title: "Dashboard Admin", url: "/admin", icon: ShieldAlert },
  { title: "Manajemen User", url: "/admin/users", icon: Users },
  { title: "Struktur Posisi", url: "/admin/positions", icon: Network },
  { title: "Arus Persuratan", url: "/admin/mail-flow", icon: Activity },
  { title: "Pengaturan Sistem", url: "/admin/settings", icon: Settings },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const trpc = useTRPC()
  const { data: sessionData } = useSession()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  // Fetch live profile with PBAC position and pending counts
  const { data: profile } = useQuery(
    trpc.user.getProfile.queryOptions(undefined, {
      enabled: !!sessionData?.user,
      staleTime: 1000 * 30, // 30s cache
    })
  )

  const user = profile || (sessionData?.user as any)
  const isAdmin = user?.role === "admin"
  const pendingCount = profile?.pendingCount || 0

  return (
    <Sidebar variant="floating" className="border-none shadow-ambient" {...props}>
      {/* Header CTA */}
      <SidebarHeader className={isCollapsed ? "p-3 flex justify-center items-center" : "p-5"}>
        <TooltipProvider delay={0}>
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger render={
                <Link href={isAdmin ? "/admin" : "/composer"} className="group block">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md hover:scale-105 transition-transform ${
                    isAdmin 
                      ? "bg-gradient-to-tr from-destructive to-rose-600 text-destructive-foreground" 
                      : "bg-gradient-to-tr from-primary to-cyan-600 text-primary-foreground"
                  }`}>
                    {isAdmin ? <ShieldAlert className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </div>
                </Link>
              } />
              <TooltipContent side="right" className="font-semibold text-xs">
                {isAdmin ? "Dashboard Admin" : "Buat Naskah Dinas"}
              </TooltipContent>
            </Tooltip>
          ) : isAdmin ? (
            <Link href="/admin" className="group block">
              <button className="relative w-full flex items-center justify-between bg-gradient-to-r from-destructive via-destructive/95 to-rose-700 hover:from-destructive/95 hover:to-rose-600 text-destructive-foreground rounded-2xl px-4 py-3 font-semibold text-xs tracking-wide transition-all duration-500 ease-[var(--ease-fluid)] active:scale-[0.98] shadow-lg shadow-destructive/20 hover:shadow-destructive/30">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                    <ShieldAlert className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="font-bold tracking-wider uppercase text-[11px]">KONSOL ADMINISTRATOR</span>
                </div>
                <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center transition-all duration-500 ease-[var(--ease-fluid)] group-hover:translate-x-0.5 group-hover:scale-105 group-hover:bg-white/25">
                  <ArrowRight className="h-3.5 w-3.5 text-white" />
                </div>
              </button>
            </Link>
          ) : (
            <Link href="/composer" className="group block">
              <button className="relative w-full flex items-center justify-between bg-gradient-to-r from-primary via-primary/95 to-cyan-700 hover:from-primary/95 hover:to-cyan-600 text-primary-foreground rounded-2xl px-4 py-3 font-semibold text-xs tracking-wide transition-all duration-500 ease-[var(--ease-fluid)] active:scale-[0.98] shadow-lg shadow-primary/20 hover:shadow-primary/30">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                    <Plus className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="font-bold tracking-wider uppercase text-[11px]">BUAT NASKAH DINAS</span>
                </div>
                {/* Micro-interactive trailing pill */}
                <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center transition-all duration-500 ease-[var(--ease-fluid)] group-hover:translate-x-0.5 group-hover:scale-105 group-hover:bg-white/25">
                  <ArrowRight className="h-3.5 w-3.5 text-white" />
                </div>
              </button>
            </Link>
          )}
        </TooltipProvider>
      </SidebarHeader>

      {/* Navigation Content */}
      <SidebarContent className="px-3 space-y-1">
        {/* Standard User Navigation: Strictly for non-admins */}
        {!isAdmin && navGroups.map((group) => (
          <SidebarGroup key={group.label} className="py-1">
            <SidebarGroupLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.18em] mb-1.5 px-2.5">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname === item.url || pathname?.startsWith(item.url + "/")
                  const showPendingBadge = item.badgeType === "pending" && pendingCount > 0

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={isActive}
                        render={
                          <Link
                            href={item.url}
                            className={`flex items-center gap-3 w-full py-2 px-3 rounded-xl text-xs font-medium transition-all duration-300 ease-[var(--ease-fluid)] hover:bg-muted/50 ${
                              isActive
                                ? "bg-primary/10 text-primary font-bold shadow-sm"
                                : "text-foreground/80 hover:text-foreground"
                            }`}
                          />
                        }
                      >
                        <item.icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? "text-primary opacity-100" : "opacity-70"}`} />
                        <span className="flex-1 truncate">{item.title}</span>
                        {showPendingBadge && (
                          <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                            {pendingCount}
                          </span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Superadmin Panel Navigation: Strictly for admins */}
        {isAdmin && (
          <SidebarGroup className="py-1">
            <SidebarGroupLabel className="text-[10px] font-bold text-destructive uppercase tracking-[0.18em] mb-2 px-2.5 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-destructive" />
              SUPERADMIN PANEL
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => {
                  const isActive = pathname === item.url || (item.url !== "/admin" && pathname?.startsWith(item.url))
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={isActive}
                        render={
                          <Link
                            href={item.url}
                            className={`flex items-center gap-3 w-full py-2 px-3 rounded-xl text-xs font-medium transition-all duration-300 ease-[var(--ease-fluid)] hover:bg-muted/50 ${
                              isActive
                                ? "bg-destructive/10 text-destructive font-bold shadow-sm"
                                : "text-foreground/80 hover:text-foreground"
                            }`}
                          />
                        }
                      >
                        <item.icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? "text-destructive opacity-100" : "opacity-70"}`} />
                        <span className="flex-1 truncate">{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer Profile */}
      <SidebarFooter className="p-3 border-t border-black/5 dark:border-white/5">
        <SidebarUserProfile profile={profile} sessionUser={sessionData?.user} />
      </SidebarFooter>
    </Sidebar>
  )
}

function SidebarUserProfile({
  profile,
  sessionUser,
}: {
  profile: any
  sessionUser: any
}) {
  const router = useRouter()
  const { isMobile, state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const user = profile || sessionUser
  const isAdmin = user?.role === "admin"

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  if (!user) {
    return (
      <div className="h-10 w-full rounded-xl bg-muted/40 animate-pulse" />
    )
  }

  const userName: string = user?.name || "Pegawai"
  const initials = userName
    .split(" ")
    .map((n: string) => n[0] || "")
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const positionLabel = isAdmin
    ? "Superadmin"
    : profile?.position?.code || profile?.position?.title || "Pegawai PLN"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="w-full rounded-2xl p-2 transition-all duration-300 hover:bg-muted/50 data-[state=open]:bg-muted/60"
              >
                <Avatar className="h-8 w-8 rounded-xl border border-primary/20 shadow-sm shrink-0">
                  <AvatarImage src={user.image || undefined} alt={user.name} />
                  <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                {!isCollapsed && (
                  <>
                    <div className="grid flex-1 text-left text-xs leading-tight ml-2">
                      <span className="truncate font-bold text-foreground">{user.name}</span>
                      <span className="truncate text-[10px] text-muted-foreground font-medium">
                        {positionLabel}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4 text-muted-foreground opacity-60" />
                  </>
                )}
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent
            className="w-64 rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-3xl p-2"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            {/* Header Profile Info */}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-2.5 bg-muted/40 rounded-xl font-normal">
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-9 w-9 rounded-xl border border-primary/20">
                    <AvatarImage src={user.image || undefined} alt={user.name} />
                    <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-xs leading-tight min-w-0">
                    <span className="truncate font-bold text-foreground">{user.name}</span>
                    <span className="truncate text-[11px] text-muted-foreground">{user.email}</span>
                    {user.nip && (
                      <span className="text-[10px] font-mono text-primary font-semibold mt-0.5">
                        NIP: {user.nip}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {isAdmin ? "Status Akun" : "Jabatan"}
                  </span>
                  <Badge
                    variant={isAdmin ? "destructive" : "secondary"}
                    className="text-[10px] font-bold px-2 py-0 uppercase"
                  >
                    {positionLabel}
                  </Badge>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="my-1 bg-black/5 dark:border-white/5" />

            {/* Quick Actions */}
            <DropdownMenuGroup className="py-0.5">
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
                      <ShieldAlert className="w-4 h-4" />
                      <span>Panel Superadmin</span>
                    </Link>
                  }
                />
              )}
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="my-1 bg-black/5 dark:border-white/5" />

            {/* Sign Out */}
            <DropdownMenuItem
              onClick={handleSignOut}
              className="flex items-center gap-2.5 py-2 px-2.5 rounded-lg text-xs font-medium text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar dari Akun</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

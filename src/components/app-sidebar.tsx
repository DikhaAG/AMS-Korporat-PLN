"use client"

import * as React from "react"
import {
  Inbox,
  Send,
  FileText,
  Search,
  CheckCircle,
  XCircle,
  Plus,
  FolderOpen,
  ArrowRight
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
import Link from "next/link"
import { usePathname } from "next/navigation"

const navGroups = [
  {
    label: "SURAT MASUK",
    items: [
      { title: "Surat Masuk", url: "/inbox", icon: Inbox, badge: "12" },
      { title: "Terkirim", url: "/inbox/terkirim", icon: Send },
    ]
  },
  {
    label: "SURAT KELUAR",
    items: [
      { title: "Persetujuan", url: "/outbox/persetujuan", icon: CheckCircle },
      { title: "Telusuri", url: "/outbox/telusuri", icon: Search },
      { title: "Konsep", url: "/outbox/konsep", icon: FileText },
      { title: "Terkirim", url: "/outbox/terkirim", icon: Send },
      { title: "Dibatalkan", url: "/outbox/dibatalkan", icon: XCircle },
    ]
  },
  {
    label: "NOTA DINAS",
    items: [
      { title: "Nota Dinas", url: "/nota-dinas", icon: FolderOpen },
      { title: "Persetujuan", url: "/nota-dinas/persetujuan", icon: CheckCircle },
      { title: "Telusuri", url: "/nota-dinas/telusuri", icon: Search },
      { title: "Konsep", url: "/nota-dinas/konsep", icon: FileText },
      { title: "Terkirim", url: "/nota-dinas/terkirim", icon: Send },
      { title: "Dibatalkan", url: "/nota-dinas/dibatalkan", icon: XCircle },
    ]
  },
  {
    label: "NASKAH DINAS GABUNGAN",
    items: [
      { title: "Naskah Dinas Gabungan", url: "/gabungan", icon: FolderOpen },
      { title: "Persetujuan", url: "/gabungan/persetujuan", icon: CheckCircle },
      { title: "Terkirim", url: "/gabungan/terkirim", icon: Send },
    ]
  }
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { data } = useSession()
  const isAdmin = (data?.user as any)?.role === "admin"

  return (
    <Sidebar variant="floating" className="border-none shadow-ambient" {...props}>
      <SidebarHeader className="p-6">
        <Link href="/composer" className="group block">
          <button className="relative w-full flex items-center justify-between bg-[#145f74] hover:bg-[#125365] text-white rounded-[2rem] px-5 py-3 font-semibold text-sm transition-all duration-700 ease-[var(--ease-fluid)] active:scale-[0.98] shadow-inner-glow">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              BUAT NASKAH DINAS
            </div>
            {/* Button-in-Button Trailing Icon */}
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center transition-all duration-700 ease-[var(--ease-fluid)] group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105 group-hover:bg-white/20">
              <ArrowRight className="h-4 w-4" />
            </div>
          </button>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-4">
        {!isAdmin && navGroups.map((group) => (
          <SidebarGroup key={group.label} className="pt-0 pb-4">
            <SidebarGroupLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2 px-2">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={pathname === item.url || pathname?.startsWith(item.url + '/')}
                      render={<Link href={item.url} className="flex items-center gap-3 w-full py-2.5 px-3 rounded-xl transition-all duration-500 ease-[var(--ease-fluid)] hover:bg-muted/50 data-[active=true]:bg-primary/5 data-[active=true]:text-primary data-[active=true]:font-bold" />}
                    >
                      <item.icon className="h-4 w-4 opacity-80" />
                      <span className="flex-1 text-sm">{item.title}</span>
                      {item.badge && (
                        <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                          {item.badge}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* ADMIN LINKS */}
        <AdminLinks pathname={pathname} />

      </SidebarContent>

      <SidebarFooter>
        <UserProfile />
      </SidebarFooter>
    </Sidebar>
  )
}

import { useSession, signOut } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { LogOut, User, ShieldAlert, Users, Network, ChevronsUpDown, BadgeCheck, Bell } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

function AdminLinks({ pathname }: { pathname: string }) {
  const { data } = useSession()

  if ((data?.user as any)?.role !== "admin") return null

  const adminItems = [
    { title: "Dashboard Admin", url: "/admin", icon: ShieldAlert },
    { title: "Manajemen User", url: "/admin/users", icon: Users },
    { title: "Struktur Posisi", url: "/admin/positions", icon: Network },
  ]

  return (
    <SidebarGroup className="pt-4 pb-4 border-t border-border/50">
      <SidebarGroupLabel className="text-[10px] font-bold text-destructive uppercase tracking-[0.2em] mb-2 px-2 flex items-center gap-2">
        <ShieldAlert className="w-3 h-3" />
        SUPERADMIN PANEL
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {adminItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                isActive={pathname === item.url || pathname?.startsWith(item.url + '/')}
                render={<Link href={item.url} className="flex items-center gap-3 w-full py-2.5 px-3 rounded-xl transition-all duration-500 ease-[var(--ease-fluid)] hover:bg-muted/50 data-[active=true]:bg-destructive/10 data-[active=true]:text-destructive data-[active=true]:font-bold" />}
              >
                <item.icon className="h-4 w-4 opacity-80" />
                <span className="flex-1 text-sm">{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function UserProfile() {
  const { data, isPending } = useSession()
  const router = useRouter()
  const { isMobile } = useSidebar()

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  if (isPending) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="animate-pulse bg-muted/30" />
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (!data?.user) return null

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={(data.user as any)?.image || ""} alt={data.user.name || ""} />
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{data.user.name}</span>
                <span className="truncate text-xs">{data.user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          }>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={(data.user as any)?.image || ""} alt={data.user.name || ""} />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{data.user.name}</span>
                    <span className="truncate text-xs">{data.user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck className="mr-2 h-4 w-4" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}


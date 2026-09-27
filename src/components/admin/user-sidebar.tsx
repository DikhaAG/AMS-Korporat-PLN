"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTRPC } from "@/trpc/client"
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  ShieldAlert,
  Network,
  Briefcase,
  Mail,
  BadgeCheck,
  User,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Trash2,
  Save,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import { updateUserSchema, type UpdateUserInput } from "@/shared/schemas/user"

export type UserItem = {
  id: string
  name: string
  email: string
  nip?: string | null
  role: string | null
  positionId: string | null
  image?: string | null
}

function generateSecurePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*"
  let password = ""
  password += "ABCDEFGHJKLMNPQRSTUVWXYZ"[Math.floor(Math.random() * 24)]
  password += "abcdefghijkmnopqrstuvwxyz"[Math.floor(Math.random() * 24)]
  password += "23456789"[Math.floor(Math.random() * 8)]
  password += "!@#$%^&*"[Math.floor(Math.random() * 8)]
  for (let i = 0; i < 8; i++) {
    password += chars[Math.floor(Math.random() * chars.length)]
  }
  return password.split("").sort(() => 0.5 - Math.random()).join("")
}

export function UserSidebar({ 
  user, 
  onClose,
  onDeleteRequest,
}: { 
  user: UserItem | null
  onClose: () => void 
  onDeleteRequest?: (user: UserItem) => void
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState("profile")
  const [showPassword, setShowPassword] = useState(false)
  const [copiedPass, setCopiedPass] = useState(false)

  // Fetch available positions for assignment dropdown
  const { data: positions, isLoading: isLoadingPositions } = useQuery(
    trpc.admin.getPositions.queryOptions(undefined, { enabled: !!user })
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      id: user?.id || "",
      name: user?.name || "",
      email: user?.email || "",
      nip: user?.nip || "",
      role: (user?.role === "admin" ? "admin" : "user") as "admin" | "user",
      positionId: user?.positionId || "",
      newPassword: "",
    },
  })

  useEffect(() => {
    if (user) {
      reset({
        id: user.id,
        name: user.name,
        email: user.email,
        nip: user.nip || "",
        role: (user.role === "admin" ? "admin" : "user") as "admin" | "user",
        positionId: user.positionId || "",
        newPassword: "",
      })
    }
  }, [user, reset])

  const currentRole = watch("role")
  const currentPositionId = watch("positionId")

  // Mutations
  const updateUserMutation = useMutation(
    trpc.admin.updateUser.mutationOptions({
      onSuccess: (updated) => {
        queryClient.invalidateQueries({ queryKey: [["admin", "getUsers"]] })
        queryClient.invalidateQueries({ queryKey: [["admin", "getUsersByPosition"]] })
        toast.success("Profil Pengguna Diperbarui", {
          description: `Data ${updated.name} berhasil disimpan ke database.`,
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
        })
        if (user) {
          user.name = updated.name
          user.email = updated.email
          user.nip = updated.nip
          user.role = updated.role
          user.positionId = updated.positionId
        }
        setValue("newPassword", "")
      },
      onError: (err) => {
        toast.error("Gagal Memperbarui Pengguna", {
          description: err.message || "Terjadi kesalahan saat menyimpan perubahan.",
        })
      },
    })
  )

  const handleProfileSubmit = (values: UpdateUserInput) => {
    updateUserMutation.mutate(values)
  }

  const handleGeneratePassword = () => {
    const generated = generateSecurePassword()
    setValue("newPassword", generated, { shouldDirty: true })
    navigator.clipboard.writeText(generated)
    setCopiedPass(true)
    toast.info("Kata Sandi Baru Dibuat", {
      description: "Kata sandi acak yang aman telah disalin ke clipboard.",
    })
    setTimeout(() => setCopiedPass(false), 3000)
  }

  const initials = (user?.name || "U")
    .split(" ")
    .map((n) => n[0] || "")
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const currentPosition = positions?.find((p) => p.id === currentPositionId)

  return (
    <Sheet open={!!user} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-lg flex flex-col h-full bg-white/95 dark:bg-neutral-950/95 backdrop-blur-3xl border-l border-black/10 dark:border-white/10 shadow-2xl p-0 overflow-hidden">
        {/* Top Accent Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600" />

        {/* Drawer Header */}
        <div className="px-6 pt-6 pb-4 bg-muted/20 border-b border-black/5 dark:border-white/5">
          <SheetHeader className="text-left space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="w-14 h-14 border-2 border-primary/20 shadow-md">
                <AvatarImage src={user?.image || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <SheetTitle className="text-xl font-bold tracking-tight truncate text-foreground">
                  {user?.name}
                </SheetTitle>
                <div className="flex flex-col gap-0.5 text-xs text-muted-foreground mt-0.5">
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{user?.email}</span>
                  </div>
                  {user?.nip && (
                    <div className="flex items-center gap-1.5 font-mono text-primary font-semibold text-[11px]">
                      <BadgeCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>NIP: {user.nip}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Status Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground font-medium">Status Akun:</span>
                <Badge
                  variant={currentRole === "admin" ? "destructive" : "secondary"}
                  className="text-[10px] font-bold uppercase px-2 py-0"
                >
                  {currentRole === "admin" ? "Superadmin" : "User"}
                </Badge>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground font-medium">Jabatan:</span>
                <span className="text-[11px] font-semibold text-foreground truncate max-w-[150px]">
                  {currentRole === "admin" ? "Sistem Administrator" : currentPosition?.code || "Non-Struktural"}
                </span>
              </div>
            </div>
          </SheetHeader>
        </div>

        {/* Tabbed Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-3 border-b border-black/5 dark:border-white/5 bg-background">
            <TabsList className="grid grid-cols-4 h-9 bg-muted/60 p-1 rounded-xl">
              <TabsTrigger value="profile" className="text-[11px] font-bold rounded-lg">
                Profil
              </TabsTrigger>
              <TabsTrigger value="position" className="text-[11px] font-bold rounded-lg">
                Jabatan
              </TabsTrigger>
              <TabsTrigger value="security" className="text-[11px] font-bold rounded-lg">
                Keamanan
              </TabsTrigger>
              <TabsTrigger value="danger" className="text-[11px] font-bold rounded-lg text-destructive data-[state=active]:text-destructive">
                Bahaya
              </TabsTrigger>
            </TabsList>
          </div>

          <form onSubmit={handleSubmit(handleProfileSubmit)} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* TAB 1: PROFIL PEGAWAI */}
              <TabsContent value="profile" className="m-0 space-y-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Data Identitas Pegawai
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Perbarui nama lengkap, nomor induk pegawai (NIP), dan alamat email dinas.
                  </p>
                </div>

                <div className="space-y-3.5 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-name" className="text-xs font-semibold text-foreground">
                      Nama Lengkap & Gelar <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="edit-name"
                      {...register("name")}
                      placeholder="Nama pegawai"
                      className="h-10 rounded-xl bg-muted/30 border-black/10 dark:border-white/10 text-sm"
                    />
                    {errors.name && (
                      <p className="text-[11px] font-medium text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edit-nip" className="text-xs font-semibold text-foreground">
                      Nomor Induk Pegawai (NIP)
                    </Label>
                    <Input
                      id="edit-nip"
                      {...register("nip")}
                      placeholder="Contoh: 9214128ZY"
                      className="h-10 rounded-xl bg-muted/30 border-black/10 dark:border-white/10 text-sm font-mono"
                    />
                    {errors.nip && (
                      <p className="text-[11px] font-medium text-destructive">{errors.nip.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edit-email" className="text-xs font-semibold text-foreground">
                      Email Korporat PLN <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="edit-email"
                      type="email"
                      {...register("email")}
                      placeholder="pegawai@pln.co.id"
                      className="h-10 rounded-xl bg-muted/30 border-black/10 dark:border-white/10 text-sm"
                    />
                    {errors.email && (
                      <p className="text-[11px] font-medium text-destructive">{errors.email.message}</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* TAB 2: ROLE & JABATAN PBAC */}
              <TabsContent value="position" className="m-0 space-y-5">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Hak Akses & Otoritas Jabatan
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Atur hak akses superadmin atau tempatkan pegawai pada hierarki jabatan struktural.
                  </p>
                </div>

                {/* Role Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setValue("role", "user", { shouldDirty: true })}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                      currentRole === "user"
                        ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30"
                        : "border-black/10 dark:border-white/10 hover:bg-muted/40 opacity-70"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-bold text-xs text-foreground">Pengguna Standar</p>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        Akses operasional persuratan sesuai jabatan.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setValue("role", "admin", { shouldDirty: true })}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                      currentRole === "admin"
                        ? "border-destructive bg-destructive/5 shadow-sm ring-1 ring-destructive/30"
                        : "border-black/10 dark:border-white/10 hover:bg-muted/40 opacity-70"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-bold text-xs text-foreground">Superadmin</p>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        Akses penuh konfigurasi sistem & hierarki.
                      </p>
                    </div>
                  </button>
                </div>

                {/* Position Selector */}
                <div className="space-y-2 pt-2 border-t border-black/5 dark:border-white/5">
                  <Label htmlFor="edit-positionId" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                    Penempatan Jabatan Struktural
                  </Label>

                  <select
                    id="edit-positionId"
                    {...register("positionId")}
                    disabled={isLoadingPositions}
                    className="w-full h-11 px-3.5 py-2 rounded-xl text-xs bg-muted/30 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                  >
                    <option value="">
                      {isLoadingPositions ? "Memuat posisi..." : "-- Non-Struktural (Tanpa Jabatan) --"}
                    </option>
                    {positions?.map((pos) => (
                      <option key={pos.id} value={pos.id}>
                        {pos.title} [{pos.code}] {pos.isSigner ? "✍️ Penandatangan" : ""}
                      </option>
                    ))}
                  </select>

                  {currentPosition && (
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/20 mt-2">
                      <Network className="w-4 h-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0 text-xs">
                        <p className="font-bold text-foreground truncate">{currentPosition.title}</p>
                        <p className="text-[10px] font-mono text-muted-foreground">{currentPosition.code}</p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* TAB 3: KEAMANAN & SANDI */}
              <TabsContent value="security" className="m-0 space-y-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    Reset Kata Sandi Pengguna
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Tetapkan kata sandi baru jika pegawai lupa atau meminta reset kredensial.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-muted/20 border border-black/5 dark:border-white/5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-password" className="text-xs font-semibold text-foreground">
                      Kata Sandi Baru (Opsional)
                    </Label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[11px] text-primary hover:text-primary/80 font-semibold inline-flex items-center gap-1 transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      {copiedPass ? "Tersalin!" : "Generate Acak"}
                    </button>
                  </div>

                  <div className="relative flex items-center">
                    <Input
                      id="edit-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan kata sandi baru (min. 8 char)"
                      {...register("newPassword")}
                      className="h-10 pr-10 rounded-xl bg-background border-black/10 dark:border-white/10 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-[11px] font-medium text-destructive">{errors.newPassword.message}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Kosongkan jika tidak ingin mengubah kata sandi akun pengguna saat ini.
                  </p>
                </div>
              </TabsContent>

              {/* TAB 4: ZONA BERBAHAYA (DANGER ZONE) */}
              <TabsContent value="danger" className="m-0 space-y-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-destructive flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Zona Berbahaya
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Tindakan permanen terkait akun dan akses pegawai dalam sistem.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/20 space-y-3">
                  <div className="space-y-1">
                    <h5 className="font-bold text-xs text-destructive">Hapus Akun Pengguna</h5>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Menghapus kredensial autentikasi, riwayat sesi aktif, dan penempatan jabatan pengguna secara permanen.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      if (user && onDeleteRequest) {
                        onDeleteRequest(user)
                      }
                    }}
                    className="w-full rounded-xl text-xs font-semibold h-10 shadow-sm flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Hapus Pengguna Ini
                  </Button>
                </div>
              </TabsContent>
            </div>

            {/* Bottom Actions Footer */}
            <div className="px-6 py-4 border-t border-black/5 dark:border-white/5 bg-background flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={updateUserMutation.isPending}
                className="rounded-xl px-4 h-10 text-xs"
              >
                Tutup
              </Button>

              <Button
                type="submit"
                disabled={updateUserMutation.isPending || !isDirty}
                className="rounded-xl px-5 h-10 bg-primary text-primary-foreground text-xs font-semibold shadow-md flex items-center gap-2"
              >
                {updateUserMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Menyimpan Perubahan...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
            </div>
          </form>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

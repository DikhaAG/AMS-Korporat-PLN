"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTRPC } from "@/trpc/client"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  UserPlus,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Shield,
  ShieldAlert,
  Briefcase,
  Network,
  CheckCircle2,
  Copy,
  Loader2,
  BadgeCheck,
} from "lucide-react"
import { createUserSchema, type CreateUserInput } from "@/shared/schemas/user"

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function generateSecurePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*"
  let password = ""
  // Ensure at least 1 uppercase, 1 lowercase, 1 number, 1 symbol
  password += "ABCDEFGHJKLMNPQRSTUVWXYZ"[Math.floor(Math.random() * 24)]
  password += "abcdefghijkmnopqrstuvwxyz"[Math.floor(Math.random() * 24)]
  password += "23456789"[Math.floor(Math.random() * 8)]
  password += "!@#$%^&*"[Math.floor(Math.random() * 8)]
  for (let i = 0; i < 8; i++) {
    password += chars[Math.floor(Math.random() * chars.length)]
  }
  // Shuffle
  return password.split("").sort(() => 0.5 - Math.random()).join("")
}

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [showPassword, setShowPassword] = useState(false)
  const [copiedPass, setCopiedPass] = useState(false)

  // Fetch structural positions for the PBAC dropdown
  const { data: positions, isLoading: isLoadingPositions } = useQuery(
    trpc.admin.getPositions.queryOptions(undefined, { enabled: open })
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      nip: "",
      password: "",
      role: "user",
      positionId: "",
    },
  })

  const currentRole = watch("role")
  const currentPassword = watch("password")
  const currentPositionId = watch("positionId")

  const createUserMutation = useMutation(
    trpc.admin.createUser.mutationOptions({
      onSuccess: (newUser) => {
        queryClient.invalidateQueries({ queryKey: [["admin", "getUsers"]] })
        queryClient.invalidateQueries({ queryKey: [["admin", "getUsersByPosition"]] })
        toast.success("Pengguna Berhasil Ditambahkan", {
          description: `${newUser.name} (${newUser.email}) telah terdaftar ke dalam sistem.`,
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
        })
        reset()
        onOpenChange(false)
      },
      onError: (err) => {
        toast.error("Gagal Menambahkan Pengguna", {
          description: err.message || "Terjadi kesalahan saat memproses data pengguna.",
        })
      },
    })
  )

  const onSubmit = (values: CreateUserInput) => {
    createUserMutation.mutate(values)
  }

  const handleGeneratePassword = () => {
    const generated = generateSecurePassword()
    setValue("password", generated, { shouldValidate: true })
    navigator.clipboard.writeText(generated)
    setCopiedPass(true)
    toast.info("Kata Sandi Dibuat & Disalin", {
      description: "Kata sandi acak yang kuat telah disalin ke clipboard.",
    })
    setTimeout(() => setCopiedPass(false), 3000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto p-0 border border-black/10 dark:border-white/10 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-2xl shadow-2xl rounded-3xl">
        {/* Glowing Top Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600" />

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8 space-y-6">
          {/* Header */}
          <DialogHeader className="text-left space-y-2 pb-2 border-b border-black/5 dark:border-white/5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wider uppercase w-fit border border-primary/20">
              <UserPlus className="w-3.5 h-3.5" />
              Sistem Administrasi Pegawai
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
              Tambah Pengguna Baru
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Daftarkan akun pegawai baru dengan hak akses dan penempatan jabatan struktural PLN.
            </DialogDescription>
          </DialogHeader>

          {/* Form Content */}
          <div className="space-y-6">
            {/* Section 1: Profil Pegawai */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <User className="w-3.5 h-3.5 text-primary" />
                Informasi Pegawai
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Lengkap */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold text-foreground">
                    Nama Lengkap & Gelar <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="name"
                      placeholder="Contoh: Hery Kurniawan, S.T."
                      {...register("name")}
                      className={`h-11 rounded-xl bg-muted/40 border-black/10 dark:border-white/10 focus-visible:ring-primary/20 ${
                        errors.name ? "border-destructive focus-visible:ring-destructive/20" : ""
                      }`}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-[11px] font-medium text-destructive">{errors.name.message}</p>
                  )}
                </div>

                {/* NIP */}
                <div className="space-y-1.5">
                  <Label htmlFor="nip" className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>NIP Pegawai (Opsional)</span>
                    <span className="text-[10px] text-muted-foreground font-normal">Format PLN</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="nip"
                      placeholder="Contoh: 9214128ZY"
                      {...register("nip")}
                      className="h-11 rounded-xl bg-muted/40 border-black/10 dark:border-white/10 focus-visible:ring-primary/20"
                    />
                  </div>
                  {errors.nip && (
                    <p className="text-[11px] font-medium text-destructive">{errors.nip.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Kredensial & Autentikasi */}
            <div className="space-y-4 pt-2 border-t border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Lock className="w-3.5 h-3.5 text-primary" />
                Kredensial & Autentikasi
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                    Email Korporat PLN <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="nama.pegawai@pln.co.id"
                      {...register("email")}
                      className={`h-11 rounded-xl bg-muted/40 border-black/10 dark:border-white/10 focus-visible:ring-primary/20 ${
                        errors.email ? "border-destructive focus-visible:ring-destructive/20" : ""
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-[11px] font-medium text-destructive">{errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                      Kata Sandi Awal <span className="text-destructive">*</span>
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
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 karakter"
                      {...register("password")}
                      className={`h-11 pr-10 rounded-xl bg-muted/40 border-black/10 dark:border-white/10 focus-visible:ring-primary/20 font-mono text-sm ${
                        errors.password ? "border-destructive focus-visible:ring-destructive/20" : ""
                      }`}
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
                  {errors.password && (
                    <p className="text-[11px] font-medium text-destructive">{errors.password.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Role & PBAC Structural Placement */}
            <div className="space-y-4 pt-2 border-t border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Shield className="w-3.5 h-3.5 text-primary" />
                Hak Akses & Penempatan Jabatan (PBAC)
              </div>

              {/* Role Picker Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue("role", "user", { shouldValidate: true })}
                  className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all ${
                    currentRole === "user"
                      ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30"
                      : "border-black/10 dark:border-white/10 hover:bg-muted/40 opacity-70 hover:opacity-100"
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">Pengguna Standar</span>
                      {currentRole === "user" && (
                        <span className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Akses operasional persuratan sesuai dengan jabatan struktural yang diampu.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setValue("role", "admin", { shouldValidate: true })}
                  className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all ${
                    currentRole === "admin"
                      ? "border-destructive bg-destructive/5 shadow-sm ring-1 ring-destructive/30"
                      : "border-black/10 dark:border-white/10 hover:bg-muted/40 opacity-70 hover:opacity-100"
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">Super Administrator</span>
                      {currentRole === "admin" && (
                        <span className="w-2 h-2 rounded-full bg-destructive" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Hak penuh konfigurasi sistem, hierarki pohon jabatan, dan log audit forensik.
                    </p>
                  </div>
                </button>
              </div>

              {/* Position Selector */}
              <div className="space-y-2 pt-1">
                <Label htmlFor="positionId" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                  Penempatan Jabatan Struktural
                  {currentRole === "user" && <span className="text-muted-foreground font-normal text-[11px]">(Direkomendasikan)</span>}
                </Label>

                <div className="relative">
                  <select
                    id="positionId"
                    {...register("positionId")}
                    disabled={isLoadingPositions}
                    className="w-full h-11 px-3.5 py-2 rounded-xl text-sm bg-muted/40 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                  >
                    <option value="">
                      {isLoadingPositions ? "Memuat data posisi..." : "-- Tanpa Penempatan Jabatan (Non-Struktural) --"}
                    </option>
                    {positions?.map((pos) => (
                      <option key={pos.id} value={pos.id}>
                        {pos.title} — [{pos.code}] {pos.isSigner ? "✍️ Penandatangan" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.positionId && (
                  <p className="text-[11px] font-medium text-destructive">{errors.positionId.message}</p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Jabatan menentukan hierarki persuratan, alur verifikasi paraf, dan penerimaan disposisi dinas.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/5 dark:border-white/5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createUserMutation.isPending}
              className="rounded-xl px-5 h-11"
            >
              Batal
            </Button>

            <Button
              type="submit"
              disabled={createUserMutation.isPending}
              className="rounded-xl px-6 h-11 bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center gap-2"
            >
              {createUserMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mendaftarkan Akun...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Simpan & Buat Akun
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

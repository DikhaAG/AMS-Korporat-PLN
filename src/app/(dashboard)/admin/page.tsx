"use client"

import { ShieldAlert, Users, Network, ArrowRight, Activity, Mail, Settings } from "lucide-react"
import Link from "next/link"

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto pb-12 pt-4">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-destructive/10 via-background to-destructive/5 border border-destructive/10 p-10 md:p-12 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.05)]">
        {/* Decorative background element */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-destructive/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-[11px] font-bold tracking-widest uppercase mb-1 border border-destructive/20 shadow-sm">
              <ShieldAlert className="w-3.5 h-3.5" />
              Restricted Area
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Superadmin <span className="text-transparent bg-clip-text bg-gradient-to-r from-destructive to-orange-500">Command Center</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-xl">
              Pusat kendali utama untuk mengelola pengguna, hierarki organisasi struktural (ltree), dan kebijakan sistem korporat.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* User Card */}
        <Link href="/admin/users" className="group block h-full outline-none">
          <div className="relative h-full bg-white/70 dark:bg-neutral-900/70 backdrop-blur-2xl rounded-[2rem] border border-black/5 dark:border-white/10 shadow-ambient p-8 transition-all duration-500 ease-[var(--ease-fluid)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] hover:-translate-y-1 hover:border-primary/30 hover:bg-white dark:hover:bg-neutral-900 overflow-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-primary/5 blur-[50px] rounded-full group-hover:bg-primary/10 transition-colors duration-500 pointer-events-none" />
            
            <div className="flex justify-between items-start mb-8">
              <div className="w-14 h-14 rounded-[1.25rem] bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                 <ArrowRight className="w-5 h-5 text-foreground" />
              </div>
            </div>
            
            <h2 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors duration-300">Manajemen Pengguna</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Atur role sistem (admin/user), monitor aktivitas akun, dan kelola penugasan wewenang untuk masing-masing individu.
            </p>
          </div>
        </Link>

        {/* Positions Card */}
        <Link href="/admin/positions" className="group block h-full outline-none">
          <div className="relative h-full bg-white/70 dark:bg-neutral-900/70 backdrop-blur-2xl rounded-[2rem] border border-black/5 dark:border-white/10 shadow-ambient p-8 transition-all duration-500 ease-[var(--ease-fluid)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] hover:-translate-y-1 hover:border-orange-500/30 hover:bg-white dark:hover:bg-neutral-900 overflow-hidden focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2">
            <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-orange-500/5 blur-[50px] rounded-full group-hover:bg-orange-500/10 transition-colors duration-500 pointer-events-none" />
            
            <div className="flex justify-between items-start mb-8">
              <div className="w-14 h-14 rounded-[1.25rem] bg-gradient-to-br from-orange-500/10 to-orange-500/5 flex items-center justify-center border border-orange-500/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <Network className="w-7 h-7 text-orange-500" />
              </div>
              <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                 <ArrowRight className="w-5 h-5 text-foreground" />
              </div>
            </div>
            
            <h2 className="text-xl font-bold mb-3 text-foreground group-hover:text-orange-500 transition-colors duration-300">Struktur Posisi</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Drag-and-drop editor interaktif untuk membuat, menghapus, atau mengubah hirarki parent-child organisasi korporat.
            </p>
          </div>
        </Link>

        {/* Mail Flow Card */}
        <Link href="/admin/mail-flow" className="group block h-full outline-none">
          <div className="relative h-full bg-white/70 dark:bg-neutral-900/70 backdrop-blur-2xl rounded-[2rem] border border-black/5 dark:border-white/10 shadow-ambient p-8 transition-all duration-500 ease-[var(--ease-fluid)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] hover:-translate-y-1 hover:border-blue-500/30 hover:bg-white dark:hover:bg-neutral-900 overflow-hidden focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
            <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-blue-500/5 blur-[50px] rounded-full group-hover:bg-blue-500/10 transition-colors duration-500 pointer-events-none" />
            
            <div className="flex justify-between items-start mb-8">
              <div className="w-14 h-14 rounded-[1.25rem] bg-gradient-to-br from-blue-500/10 to-blue-500/5 flex items-center justify-center border border-blue-500/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <Mail className="w-7 h-7 text-blue-500" />
              </div>
              <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                 <ArrowRight className="w-5 h-5 text-foreground" />
              </div>
            </div>
            
            <h2 className="text-xl font-bold mb-3 text-foreground group-hover:text-blue-500 transition-colors duration-300">Alur Naskah Dinas</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Pantau secara real-time pergerakan naskah dinas masuk dan keluar lintas departemen dengan analitik komprehensif.
            </p>
          </div>
        </Link>

        {/* Activity Logs Card */}
        <Link href="/admin/activity-logs" className="group block h-full outline-none">
          <div className="relative h-full bg-white/70 dark:bg-neutral-900/70 backdrop-blur-2xl rounded-[2rem] border border-black/5 dark:border-white/10 shadow-ambient p-8 transition-all duration-500 ease-[var(--ease-fluid)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] hover:-translate-y-1 hover:border-emerald-500/30 hover:bg-white dark:hover:bg-neutral-900 overflow-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2">
            <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-emerald-500/5 blur-[50px] rounded-full group-hover:bg-emerald-500/10 transition-colors duration-500 pointer-events-none" />
            
            <div className="flex justify-between items-start mb-8">
              <div className="w-14 h-14 rounded-[1.25rem] bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 flex items-center justify-center border border-emerald-500/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <Activity className="w-7 h-7 text-emerald-500" />
              </div>
              <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                 <ArrowRight className="w-5 h-5 text-foreground" />
              </div>
            </div>
            
            <h2 className="text-xl font-bold mb-3 text-foreground group-hover:text-emerald-500 transition-colors duration-300">Log Aktivitas</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Tinjau jejak audit semua aktivitas pengguna dalam sistem, dari pembuatan dokumen, delegasi, hingga persetujuan.
            </p>
          </div>
        </Link>
        
        {/* Settings Card */}
        <Link href="/admin/settings" className="group block h-full outline-none lg:col-span-2 xl:col-span-1">
          <div className="relative h-full bg-white/70 dark:bg-neutral-900/70 backdrop-blur-2xl rounded-[2rem] border border-black/5 dark:border-white/10 shadow-ambient p-8 transition-all duration-500 ease-[var(--ease-fluid)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] hover:-translate-y-1 hover:border-violet-500/30 hover:bg-white dark:hover:bg-neutral-900 overflow-hidden focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2">
            <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-violet-500/5 blur-[50px] rounded-full group-hover:bg-violet-500/10 transition-colors duration-500 pointer-events-none" />
            
            <div className="flex justify-between items-start mb-8">
              <div className="w-14 h-14 rounded-[1.25rem] bg-gradient-to-br from-violet-500/10 to-violet-500/5 flex items-center justify-center border border-violet-500/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <Settings className="w-7 h-7 text-violet-500" />
              </div>
              <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                 <ArrowRight className="w-5 h-5 text-foreground" />
              </div>
            </div>
            
            <h2 className="text-xl font-bold mb-3 text-foreground group-hover:text-violet-500 transition-colors duration-300">Konfigurasi Sistem</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Kelola pengaturan global, parameter notifikasi, referensi penomoran dokumen, dan preferensi aplikasi korporat.
            </p>
          </div>
        </Link>
      </div>
    </div>
  )
}

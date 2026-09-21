"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Settings, Save, ShieldAlert, Bell, Hash } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

// Zod validation schemas
const generalSchema = z.object({
  companyName: z.string().min(3, "Minimal 3 karakter"),
  supportEmail: z.string().email("Email tidak valid"),
});

const notificationSchema = z.object({
  emailNotifications: z.boolean(),
  inAppNotifications: z.boolean(),
});

export default function SettingsPage() {
  const trpc = useTRPC()
  const { data: settings, isLoading } = useQuery({
    ...trpc.admin.getSettings.queryOptions()
  });
  const updateSetting = useMutation({
    ...trpc.admin.updateSetting.mutationOptions(),
    onSuccess: () => {
      toast.success("Pengaturan berhasil disimpan.");
    }
  });

  const formGeneral = useForm<z.infer<typeof generalSchema>>({
    resolver: zodResolver(generalSchema),
    defaultValues: { companyName: "", supportEmail: "" },
  });

  const formNotif = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: { emailNotifications: true, inAppNotifications: true },
  });

  // Load data into forms once fetched
  useEffect(() => {
    if (settings) {
      const getVal = (key: string, def: any) => settings.find(s => s.key === key)?.value ?? def;
      formGeneral.reset({
        companyName: getVal("companyName", "PLN Corporate"),
        supportEmail: getVal("supportEmail", "support@pln.co.id"),
      });
      formNotif.reset({
        emailNotifications: getVal("emailNotifications", true),
        inAppNotifications: getVal("inAppNotifications", true),
      });
    }
  }, [settings, formGeneral, formNotif]);

  const onSaveGeneral = (values: z.infer<typeof generalSchema>) => {
    updateSetting.mutate({ key: "companyName", value: values.companyName, description: "Nama Perusahaan" });
    updateSetting.mutate({ key: "supportEmail", value: values.supportEmail, description: "Email Bantuan" });
  };

  const onSaveNotif = (values: z.infer<typeof notificationSchema>) => {
    updateSetting.mutate({ key: "emailNotifications", value: values.emailNotifications, description: "Notifikasi Email Global" });
    updateSetting.mutate({ key: "inAppNotifications", value: values.inAppNotifications, description: "Notifikasi In-App Global" });
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 max-w-[1200px] mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">Konfigurasi Sistem</h2>
        <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
          Kelola pengaturan global, parameter notifikasi, referensi penomoran dokumen, dan preferensi aplikasi korporat.
        </p>
      </div>

      <Tabs defaultValue="general" className="flex flex-col gap-6 mt-6">
        <TabsList className="flex flex-row h-auto w-full bg-transparent p-0 gap-8 justify-start overflow-x-auto border-b border-border/40 shrink-0 rounded-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <TabsTrigger value="general" className="relative justify-center gap-2.5 text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground rounded-none px-1 py-4 transition-colors font-medium whitespace-nowrap after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary after:scale-x-0 data-[state=active]:after:scale-x-100 after:transition-transform after:duration-300 after:origin-center">
            <Settings className="w-4 h-4" />
            Umum
          </TabsTrigger>
          <TabsTrigger value="notifications" className="relative justify-center gap-2.5 text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground rounded-none px-1 py-4 transition-colors font-medium whitespace-nowrap after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary after:scale-x-0 data-[state=active]:after:scale-x-100 after:transition-transform after:duration-300 after:origin-center">
            <Bell className="w-4 h-4" />
            Notifikasi
          </TabsTrigger>
          <TabsTrigger value="security" className="relative justify-center gap-2.5 text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground rounded-none px-1 py-4 transition-colors font-medium whitespace-nowrap after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary after:scale-x-0 data-[state=active]:after:scale-x-100 after:transition-transform after:duration-300 after:origin-center">
            <ShieldAlert className="w-4 h-4" />
            Keamanan
          </TabsTrigger>
          <TabsTrigger value="numbering" className="relative justify-center gap-2.5 text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground rounded-none px-1 py-4 transition-colors font-medium whitespace-nowrap after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary after:scale-x-0 data-[state=active]:after:scale-x-100 after:transition-transform after:duration-300 after:origin-center">
            <Hash className="w-4 h-4" />
            Penomoran Naskah
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 w-full max-w-4xl">
          <TabsContent value="general" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <form onSubmit={formGeneral.handleSubmit(onSaveGeneral)} className="bg-card border border-border/40 shadow-sm p-6 sm:p-8 rounded-xl space-y-8">
              <div className="space-y-1.5">
                <h3 className="text-xl font-medium tracking-tight">Pengaturan Umum</h3>
                <p className="text-sm text-muted-foreground">Preferensi dasar aplikasi dan informasi korporat.</p>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2.5">
                  <Label className="text-sm font-medium">Nama Perusahaan</Label>
                  <Input {...formGeneral.register("companyName")} disabled={isLoading} className="max-w-md h-10" />
                  {formGeneral.formState.errors.companyName && (
                    <p className="text-sm text-destructive font-medium">{formGeneral.formState.errors.companyName.message}</p>
                  )}
                </div>
                
                <div className="space-y-2.5">
                  <Label className="text-sm font-medium">Email Bantuan (Support)</Label>
                  <Input {...formGeneral.register("supportEmail")} disabled={isLoading} className="max-w-md h-10" placeholder="support@domain.com" />
                  {formGeneral.formState.errors.supportEmail && (
                    <p className="text-sm text-destructive font-medium">{formGeneral.formState.errors.supportEmail.message}</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end pt-4 border-t border-border/40">
                <Button type="submit" disabled={updateSetting.isPending} className="h-10 px-6">
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="notifications" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <form onSubmit={formNotif.handleSubmit(onSaveNotif)} className="bg-card border border-border/40 shadow-sm p-6 sm:p-8 rounded-xl space-y-8">
              <div className="space-y-1.5">
                <h3 className="text-xl font-medium tracking-tight">Notifikasi Global</h3>
                <p className="text-sm text-muted-foreground">Konfigurasi pengiriman notifikasi ke pengguna dalam sistem.</p>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start justify-between py-2">
                  <div className="space-y-1 pr-6">
                    <Label className="text-base font-medium">Notifikasi Email</Label>
                    <p className="text-sm text-muted-foreground leading-relaxed">Kirim ringkasan harian dan peringatan mendesak melalui email terdaftar pengguna.</p>
                  </div>
                  <Switch
                    checked={formNotif.watch("emailNotifications")}
                    onCheckedChange={(checked) => formNotif.setValue("emailNotifications", checked)}
                    className="mt-1"
                  />
                </div>
                
                <div className="flex items-start justify-between py-2">
                  <div className="space-y-1 pr-6">
                    <Label className="text-base font-medium">Notifikasi In-App</Label>
                    <p className="text-sm text-muted-foreground leading-relaxed">Tampilkan pemberitahuan real-time (toast) dan badges peringatan di dalam aplikasi.</p>
                  </div>
                  <Switch
                    checked={formNotif.watch("inAppNotifications")}
                    onCheckedChange={(checked) => formNotif.setValue("inAppNotifications", checked)}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="flex justify-end pt-4 border-t border-border/40">
                <Button type="submit" disabled={updateSetting.isPending} className="h-10 px-6">
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="security" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <div className="bg-card border border-border/40 shadow-sm p-8 sm:p-12 rounded-xl flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-2">
                <ShieldAlert className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium tracking-tight">Fitur Terkunci</h3>
              <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                Pengaturan keamanan, SSO, dan autentikasi lanjutan hanya dapat diubah oleh level Super Administrator melalui Command Line Interface (CLI).
              </p>
            </div>
          </TabsContent>

          <TabsContent value="numbering" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <div className="bg-card border border-border/40 shadow-sm p-8 sm:p-12 rounded-xl flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-2">
                <Hash className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium tracking-tight">Konfigurasi Penomoran</h3>
              <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                Format penomoran naskah dinas dikunci dan mengikuti standar ADR-004. Hubungi tim pengembangan teknis untuk kustomisasi khusus struktur divisi.
              </p>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

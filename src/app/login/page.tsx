"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { 
  ArrowRight, 
  Loader2, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Mail,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.email("Format email tidak valid"),
  password: z.string().min(1, "Password harus diisi"),
});

type LoginForm = z.infer<typeof loginSchema>;
type AuthStatus = "idle" | "loading" | "success" | "error";

export default function LoginPage() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<AuthStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [debugDetails, setDebugDetails] = useState<string | null>(null);
  const [authenticatedUser, setAuthenticatedUser] = useState<{ email?: string; name?: string } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setAuthStatus("loading");
    setErrorMsg("");
    setDebugDetails(null);

    const origin = typeof window !== "undefined" ? window.location.origin : "server";
    console.group(`🔐 [Auth Login Attempt] ${new Date().toISOString()}`);
    console.log("Email:", data.email);
    console.log("Browser Origin:", origin);
    console.log("App URL Env:", process.env.NEXT_PUBLIC_APP_URL);

    try {
      const result = await signIn.email({
        email: data.email,
        password: data.password,
        fetchOptions: {
          onRequest: (ctx) => {
            console.log("📤 [Auth Request]", ctx.url, ctx.method, ctx.headers);
          },
          onResponse: (ctx) => {
            console.log("📥 [Auth Response]", ctx.response.status, ctx.response.statusText);
          },
          onError: (ctx) => {
            console.error("❌ [Auth onError Callback]", ctx.error);
            const status = ctx.response?.status;
            const message = ctx.error?.message || "Gagal masuk. Periksa kembali email dan password Anda.";
            setAuthStatus("error");
            setErrorMsg(message);
            setDebugDetails(
              `Status: ${status || "N/A"} | Code: ${ctx.error?.status || "N/A"}\nMessage: ${message}\nDetails: ${JSON.stringify(ctx.error, null, 2)}`
            );
            toast.error("Gagal Masuk", {
              description: message,
            });
          },
        },
      });

      console.log("📊 [Auth Signin Result]:", result);
      console.groupEnd();

      if (result.data) {
        setAuthStatus("success");
        setAuthenticatedUser({
          email: data.email,
          name: (result.data as any)?.user?.name || data.email.split("@")[0],
        });

        toast.success("Autentikasi Berhasil!", {
          description: "Selamat datang kembali di AMS Korporat. Mengalihkan...",
        });

        // Small delay so user enjoys the visual confirmation before redirect
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 900);
      } else if (result.error) {
        setAuthStatus("error");
        console.warn("⚠️ Signin returned error object:", result.error);
        const msg = result.error.message || "Gagal masuk. Periksa email dan password.";
        setErrorMsg(msg);
        setDebugDetails(JSON.stringify(result.error, null, 2));
        toast.error("Gagal Masuk", {
          description: msg,
        });
      }
    } catch (err: any) {
      setAuthStatus("error");
      console.error("💥 [Auth Uncaught Exception]:", err);
      console.groupEnd();
      const fallbackMsg = "Terjadi kesalahan sistem saat menghubungi server autentikasi.";
      setErrorMsg(fallbackMsg);
      setDebugDetails(err?.stack || err?.message || String(err));
      toast.error("Kesalahan Sistem", {
        description: err?.message || fallbackMsg,
      });
    }
  };

  const isSubmitting = authStatus === "loading" || authStatus === "success";

  return (
    <div className="w-full max-w-[440px] mx-auto p-4">
      {/* Double-Bezel Card Architecture */}
      <div className="bg-white/85 dark:bg-neutral-900/85 backdrop-blur-3xl rounded-[2.25rem] border border-black/5 dark:border-white/10 shadow-ambient p-2 relative group overflow-hidden transition-all duration-500">
        
        {/* Animated Progress Bar when submitting / success */}
        {authStatus === "loading" && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-primary to-cyan-500 animate-pulse z-20" />
        )}
        {authStatus === "success" && (
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500 z-20 transition-all duration-700" />
        )}

        <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent pointer-events-none rounded-[2.25rem]" />

        {/* Inner Core */}
        <div className="bg-white dark:bg-neutral-800 rounded-[1.75rem] border border-border/50 p-8 sm:p-10 relative z-10 flex flex-col items-center">

          {/* Dynamic Badge Icon */}
          <div className="relative mb-6">
            {authStatus === "success" ? (
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner-glow ring-4 ring-emerald-500/20 animate-in zoom-in-75 duration-300">
                <CheckCircle2 className="w-9 h-9" />
              </div>
            ) : authStatus === "error" ? (
              <div className="w-16 h-16 rounded-2xl bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center shadow-inner-glow ring-4 ring-red-500/20 animate-in shake duration-300">
                <AlertCircle className="w-9 h-9" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner-glow ring-1 ring-primary/20">
                <ShieldCheck className="w-9 h-9" />
              </div>
            )}
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-foreground mb-1.5 text-center">
            {authStatus === "success" ? "Login Berhasil!" : "AMS Korporat"}
          </h1>
          <p className="text-muted-foreground text-sm text-center mb-7">
            {authStatus === "success" 
              ? "Sedang mengalihkan ke portal naskah dinas..." 
              : "Masuk untuk mengakses portal naskah dinas"}
          </p>

          {/* SUCCESS VIEW TRANSITION */}
          {authStatus === "success" ? (
            <div className="w-full space-y-5 animate-in fade-in zoom-in-95 duration-400 text-center py-4">
              <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 space-y-1.5">
                <p className="text-xs uppercase tracking-wider font-bold text-emerald-700 dark:text-emerald-300">
                  Autentikasi Terverifikasi
                </p>
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                  {authenticatedUser?.email || "Pengguna Terdaftar"}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Mempersiapkan dashboard naskah dinas...</span>
              </div>
            </div>
          ) : (
            /* LOGIN FORM VIEW */
            <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-5">
              <div className="space-y-4">
                <div>
                  <div className="relative">
                    <Input
                      {...register("email")}
                      type="email"
                      disabled={isSubmitting}
                      placeholder="name@pln.co.id"
                      className={`h-13 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/30 text-base px-4 pl-11 transition-colors ${
                        errors.email ? "border-red-500 focus-visible:ring-red-300" : ""
                      }`}
                    />
                    <Mail className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium ml-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <div className="relative">
                    <Input
                      {...register("password")}
                      type="password"
                      disabled={isSubmitting}
                      placeholder="Password"
                      className={`h-13 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/30 text-base px-4 pl-11 transition-colors ${
                        errors.password ? "border-red-500 focus-visible:ring-red-300" : ""
                      }`}
                    />
                    <Lock className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium ml-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Error Box with Debug Toggle */}
              {errorMsg && (
                <div className="p-3.5 bg-red-50/90 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 rounded-xl text-xs font-medium animate-in slide-in-from-top-1 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p className="leading-snug">{errorMsg}</p>
                  </div>
                  {debugDetails && (
                    <details className="text-[11px] text-red-800 dark:text-red-300 bg-red-100/50 dark:bg-red-900/30 p-2 rounded-lg border border-red-200 dark:border-red-800 cursor-pointer overflow-x-auto">
                      <summary className="font-semibold select-none">Detail Teknis (Debug Info)</summary>
                      <pre className="mt-1.5 font-mono whitespace-pre-wrap">{debugDetails}</pre>
                    </details>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full mt-2 flex items-center justify-center bg-[#145f74] hover:bg-[#125365] text-white rounded-xl h-13 font-bold text-sm sm:text-base tracking-wide transition-all duration-300 active:scale-[0.98] shadow-inner-glow disabled:opacity-80 disabled:cursor-not-allowed"
              >
                {authStatus === "loading" ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Memverifikasi Kredensial...</span>
                  </div>
                ) : (
                  <>
                    <span>MASUK</span>
                    <div className="absolute right-2 w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center transition-all duration-300 group-hover:bg-white/20 group-hover:scale-105">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Demo Help Footer */}
          {authStatus !== "success" && (
            <div className="mt-8 pt-5 border-t border-border/40 w-full text-center">
              <p className="text-[11px] text-muted-foreground">
                Sistem Naskah Dinas Terintegrasi &bull; PT PLN (Persero)
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}


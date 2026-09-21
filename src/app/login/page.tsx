"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";

const loginSchema = z.object({
  email: z.email("Format email tidak valid"),
  password: z.string().min(1, "Password harus diisi"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setErrorMsg("");

    try {
      const result = await signIn.email({
        email: data.email,
        password: data.password,
        fetchOptions: {
          onError: (ctx) => {
            setErrorMsg(ctx.error.message || "Gagal masuk. Periksa kembali email dan password Anda.");
          }
        }
      });

      // better-auth doesn't automatically throw on failure if you use fetchOptions.onError, 
      // but it will return an error object.
      if (result.data) {
        router.push("/");
      }
    } catch (err) {
      setErrorMsg("Terjadi kesalahan sistem. Silakan coba lagi.");
    }
  };

  return (
    <div className="w-full max-w-[420px] mx-auto p-4">
      {/* Double-Bezel Card Architecture */}
      <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-3xl rounded-[2rem] border border-black/5 dark:border-white/10 shadow-ambient p-2 relative group overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none rounded-[2rem]" />

        {/* Inner Core */}
        <div className="bg-white dark:bg-neutral-800 rounded-[1.5rem] border border-border/50 p-8 sm:p-10 relative z-10 flex flex-col items-center">

          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shadow-inner-glow">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-foreground mb-2 text-center">
            AMS Korporat
          </h1>
          <p className="text-muted-foreground text-sm text-center mb-8">
            Masuk untuk mengakses portal naskah dinas
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-5">
            <div className="space-y-4">
              <div>
                <Input
                  {...register("email")}
                  type="email"
                  placeholder="name@pln.co.id"
                  className={`h-14 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/30 text-base px-4 ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email.message}</p>}
              </div>

              <div>
                <Input
                  {...register("password")}
                  type="password"
                  placeholder="Password"
                  className={`h-14 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/30 text-base px-4 ${errors.password ? 'border-red-500' : ''}`}
                />
                {errors.password && <p className="text-red-500 text-xs mt-1 font-medium">{errors.password.message}</p>}
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium animate-in slide-in-from-top-1">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full mt-2 flex items-center justify-center bg-[#145f74] hover:bg-[#125365] text-white rounded-xl h-14 font-bold text-base transition-all duration-700 ease-[var(--ease-fluid)] active:scale-[0.98] shadow-inner-glow disabled:opacity-70 disabled:active:scale-100"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  MASUK
                  <div className="absolute right-2 w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center transition-all duration-700 ease-[var(--ease-fluid)] group-hover:bg-white/20 group-hover:scale-105 group-hover:-translate-y-[1px]">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}

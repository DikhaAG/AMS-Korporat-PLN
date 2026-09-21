import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | AMS Korporat",
  description: "Secure access to AMS Korporat Vanguard",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/10 relative overflow-hidden">
      {/* Ambient background blur elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-[128px] opacity-70 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#145f74]/20 rounded-full mix-blend-multiply filter blur-[128px] opacity-70 animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Main Content */}
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
}

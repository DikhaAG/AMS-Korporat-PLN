import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Bell, UserCircle } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col flex-1 h-[100dvh] overflow-hidden bg-background">
        
        {/* Floating Island Header */}
        <div className="absolute top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
          <header className="pointer-events-auto flex h-14 shrink-0 items-center gap-4 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl border border-black/5 dark:border-white/10 text-foreground px-4 rounded-full shadow-ambient transition-all duration-700 ease-[var(--ease-fluid)]">
            <SidebarTrigger className="-ml-1 text-muted-foreground hover:bg-black/5 hover:text-foreground rounded-full" />
            <div className="font-bold text-sm tracking-widest text-primary ml-2 uppercase">AMS Korporat</div>
            
            <div className="w-8 md:w-32" /> {/* Spacer */}
            
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-foreground">
                <Bell className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 p-1.5 rounded-full transition-colors group">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-500 ease-[var(--ease-fluid)]">
                  <UserCircle className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold hidden md:inline-block pr-3">Masayu Amelia</span>
              </div>
            </div>
          </header>
        </div>

        <main className="flex-1 overflow-auto pt-28 pb-8 px-4 md:px-8 lg:px-12 flex flex-col relative">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

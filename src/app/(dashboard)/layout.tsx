import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { FloatingIslandHeader } from "@/components/layout/floating-island-header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col flex-1 h-[100dvh] overflow-hidden bg-background">
        {/* Dynamic 2026 Floating Island Header */}
        <FloatingIslandHeader />

        <main className="flex-1 overflow-auto pt-24 pb-8 px-4 md:px-8 lg:px-12 flex flex-col relative">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/site/AppSidebar";
import { Backdrop } from "@/components/site/Backdrop";
import { Button } from "@/components/ui/button";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — AudioInsight AI" }, { name: "description", content: "Your AudioInsight workspace." }] }),
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <div className="relative min-h-screen">
      <Backdrop />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-transparent">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/10 bg-background/60 px-4 backdrop-blur md:px-6">
            <SidebarTrigger />
            <div className="relative hidden max-w-sm flex-1 md:block">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search transcripts, summaries…" className="h-9 bg-white/5 pl-9" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="icon" aria-label="Notifications"><Bell className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" className="border-white/15 bg-white/5" asChild><Link to="/">Home</Link></Button>
            </div>
          </header>
          <main className="min-h-[calc(100vh-56px)]"><Outlet /></main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

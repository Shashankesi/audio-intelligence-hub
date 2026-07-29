import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/site/AppSidebar";
import { Backdrop } from "@/components/site/Backdrop";
import { Button } from "@/components/ui/button";
import { Bell, Command as CommandIcon, LogOut, Loader2, Sparkles } from "lucide-react";
import { useSession } from "@/lib/use-session";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CommandPalette, useCommandPalette } from "@/components/site/CommandPalette";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — AudioInsight AI" }, { name: "description", content: "Your AudioInsight workspace." }] }),
  component: DashboardLayout,
});

function DashboardLayout() {
  const nav = useNavigate();
  const { user, loading } = useSession();
  const { open, setOpen } = useCommandPalette();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  if (loading || !user) {
    return (
      <div className="relative grid min-h-screen place-items-center">
        <Backdrop />
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    nav({ to: "/" });
  };

  return (
    <div className="relative min-h-screen">
      <Backdrop />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-transparent">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/10 bg-background/60 px-4 backdrop-blur md:px-6">
            <SidebarTrigger />
            <button
              onClick={() => setOpen(true)}
              className="group hidden h-9 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-xs text-muted-foreground transition hover:border-white/20 hover:text-foreground md:flex md:w-72"
            >
              <CommandIcon className="h-3.5 w-3.5" />
              <span>Search or jump to…</span>
              <kbd className="ml-auto rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">⌘K</kbd>
            </button>
            <div className="ml-auto flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
                <Link to="/dashboard/upload"><Sparkles className="mr-1.5 h-3.5 w-3.5" /> New</Link>
              </Button>
              <span className="hidden text-xs text-muted-foreground md:inline">{user.email}</span>
              <Button variant="ghost" size="icon" aria-label="Notifications"><Bell className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" className="border-white/15 bg-white/5" asChild><Link to="/">Home</Link></Button>
              <Button variant="ghost" size="icon" aria-label="Sign out" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
            </div>
          </header>
          <main className="min-h-[calc(100vh-56px)]"><Outlet /></main>
        </SidebarInset>
      </SidebarProvider>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </div>
  );
}

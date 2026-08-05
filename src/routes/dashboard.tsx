import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/site/AppSidebar";
import { Backdrop } from "@/components/site/Backdrop";
import { Button } from "@/components/ui/button";
import { Command as CommandIcon, LogOut, Loader2, Sparkles } from "lucide-react";
import { NotificationCenter } from "@/components/site/NotificationCenter";
import { useSession } from "@/lib/use-session";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CommandPalette, useCommandPalette } from "@/components/site/CommandPalette";
import { ScrollProgress, BackToTop, QuickUploadFab } from "@/components/site/Chrome";

const CRUMBS: Record<string, string> = {
  "": "Overview",
  upload: "Upload Audio",
  transcription: "Transcription",
  summary: "Summary",
  history: "History",
  evaluation: "Evaluation",
  datasets: "Datasets",
  profile: "Profile",
  settings: "Settings",
  help: "Help",
};

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
      <ScrollProgress />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-transparent">
          <header className="sticky top-0 z-30 mx-3 mt-3 flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-background/55 px-3 backdrop-blur-xl md:px-4">
            <SidebarTrigger />
            <Breadcrumbs />
            <button
              onClick={() => setOpen(true)}
              aria-label="Open command palette"
              className="group ml-2 hidden h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-muted-foreground transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:flex lg:w-64 xl:w-80"
            >
              <CommandIcon className="h-3.5 w-3.5" />
              <span>Search or jump to…</span>
              <kbd className="ml-auto rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">⌘K</kbd>
            </button>
            <div className="ml-auto flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="hidden rounded-xl md:inline-flex">
                <Link to="/dashboard/upload"><Sparkles className="mr-1.5 h-3.5 w-3.5" /> New</Link>
              </Button>
              <Button variant="ghost" size="icon" aria-label="Open command palette" className="lg:hidden" onClick={() => setOpen(true)}>
                <CommandIcon className="h-4 w-4" />
              </Button>
              <span className="hidden text-xs text-muted-foreground md:inline">{user.email}</span>
              <NotificationCenter />
              <Button variant="outline" size="sm" className="hidden rounded-xl border-white/15 bg-white/5 sm:inline-flex" asChild><Link to="/">Home</Link></Button>
              <Button variant="ghost" size="icon" aria-label="Sign out" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
            </div>
          </header>
          <main className="min-h-[calc(100vh-56px)]"><Outlet /></main>
          <BackToTop />
          <QuickUploadFab />
        </SidebarInset>
      </SidebarProvider>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </div>
  );
}

function Breadcrumbs() {
  const pathname = useRouterState({ select: (s: { location: { pathname: string } }) => s.location.pathname });
  const leaf = pathname.replace(/^\/dashboard\/?/, "").split("/")[0] ?? "";
  return (
    <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
      <Link to="/dashboard" className="transition-colors hover:text-foreground">Workspace</Link>
      <span aria-hidden className="opacity-40">/</span>
      <span className="font-medium text-foreground">{CRUMBS[leaf] ?? "Overview"}</span>
    </nav>
  );
}

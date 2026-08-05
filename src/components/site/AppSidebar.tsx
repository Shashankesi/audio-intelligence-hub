import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Upload, History, BarChart3, Database, UserRound, Settings as SettingsIcon, LifeBuoy, Waves, FileText, Sparkles, Zap } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSession } from "@/lib/use-session";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const main = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard, exact: true },
  { title: "Upload Audio", url: "/dashboard/upload", icon: Upload },
  { title: "Transcription", url: "/dashboard/transcription", icon: FileText },
  { title: "Summary", url: "/dashboard/summary", icon: Sparkles },
  { title: "History", url: "/dashboard/history", icon: History },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
];
const secondary = [
  { title: "Evaluation", url: "/dashboard/evaluation", icon: BarChart3 },
  { title: "Datasets", url: "/dashboard/datasets", icon: Database },
  { title: "Profile", url: "/dashboard/profile", icon: UserRound },
  { title: "Settings", url: "/dashboard/settings", icon: SettingsIcon },
  { title: "Help", url: "/dashboard/help", icon: LifeBuoy },
];

const navItemClass =
  "relative rounded-xl transition-all duration-300 hover:bg-white/[0.06] hover:text-foreground data-[active=true]:bg-white/[0.08] data-[active=true]:shadow-[inset_0_1px_0_oklch(1_0_0/0.08)] data-[active=true]:before:absolute data-[active=true]:before:left-0 data-[active=true]:before:top-1/2 data-[active=true]:before:h-5 data-[active=true]:before:w-[3px] data-[active=true]:before:-translate-y-1/2 data-[active=true]:before:rounded-full data-[active=true]:before:bg-gradient-brand";

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const active = (url: string, exact?: boolean) => (exact ? pathname === url : pathname === url || pathname.startsWith(url + "/"));
  const { user } = useSession();
  const { data: count = 0 } = useQuery({
    queryKey: ["recordings-count"],
    queryFn: async () => {
      const r = await (supabase.from("recordings") as any).select("id", { count: "exact", head: true });
      return r.count ?? 0;
    },
    enabled: !!user,
  });
  const name = (user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "You";
  const initial = (name[0] ?? "U").toUpperCase();

  return (
    <Sidebar
      collapsible="icon"
      className="border-0 [&>[data-sidebar=sidebar]]:my-3 [&>[data-sidebar=sidebar]]:ml-3 [&>[data-sidebar=sidebar]]:h-[calc(100svh-1.5rem)] [&>[data-sidebar=sidebar]]:rounded-[28px] [&>[data-sidebar=sidebar]]:border [&>[data-sidebar=sidebar]]:border-white/10 [&>[data-sidebar=sidebar]]:glass"
    >
      <SidebarHeader>
        <Link to="/" className="group flex items-center gap-2.5 px-2 py-2">
          <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-brand shadow-glow transition-transform duration-300 group-hover:scale-105">
            <Waves className="h-4 w-4 text-white" />
          </span>
          <span className="truncate text-sm font-semibold tracking-tight group-data-[collapsible=icon]:hidden">AudioInsight</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {main.map((i) => (
                <SidebarMenuItem key={i.url}>
                  <SidebarMenuButton asChild isActive={active(i.url, i.exact)} tooltip={i.title} className={navItemClass}>
                    <Link to={i.url}>
                      <i.icon className="transition-transform duration-300 group-hover/menu-item:scale-110" />
                      <span>{i.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondary.map((i) => (
                <SidebarMenuItem key={i.url}>
                  <SidebarMenuButton asChild isActive={active(i.url)} tooltip={i.title} className={navItemClass}>
                    <Link to={i.url}>
                      <i.icon className="transition-transform duration-300 group-hover/menu-item:scale-110" />
                      <span>{i.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="mx-2 mb-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 border border-white/10">
              <AvatarFallback className="bg-gradient-brand text-xs font-semibold text-white">{initial}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <div className="truncate text-xs font-medium">{name}</div>
              <div className="truncate text-[10px] text-muted-foreground">{user?.email ?? "—"}</div>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between rounded-lg bg-white/5 px-2 py-1.5 text-[10px] text-muted-foreground group-data-[collapsible=icon]:hidden">
            <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-fuchsia-300" /> {count} recordings</span>
            <span className="rounded bg-emerald-400/15 px-1.5 py-0.5 text-emerald-300">Pro</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Upload, History, BarChart3, Database, UserRound, Settings as SettingsIcon, LifeBuoy, Waves, FileText, Sparkles } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

const main = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard, exact: true },
  { title: "Upload Audio", url: "/dashboard/upload", icon: Upload },
  { title: "Transcription", url: "/dashboard/transcription", icon: FileText },
  { title: "Summary", url: "/dashboard/summary", icon: Sparkles },
  { title: "History", url: "/dashboard/history", icon: History },
];
const secondary = [
  { title: "Evaluation", url: "/dashboard/evaluation", icon: BarChart3 },
  { title: "Datasets", url: "/dashboard/datasets", icon: Database },
  { title: "Profile", url: "/dashboard/profile", icon: UserRound },
  { title: "Settings", url: "/dashboard/settings", icon: SettingsIcon },
  { title: "Help", url: "/dashboard/help", icon: LifeBuoy },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const active = (url: string, exact?: boolean) => (exact ? pathname === url : pathname === url || pathname.startsWith(url + "/"));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-2 px-2 py-1.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand shadow-glow">
            <Waves className="h-4 w-4 text-white" />
          </span>
          <span className="text-sm font-semibold">AudioInsight</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {main.map((i) => (
                <SidebarMenuItem key={i.url}>
                  <SidebarMenuButton asChild isActive={active(i.url, i.exact)}>
                    <Link to={i.url}><i.icon /><span>{i.title}</span></Link>
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
                  <SidebarMenuButton asChild isActive={active(i.url)}>
                    <Link to={i.url}><i.icon /><span>{i.title}</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

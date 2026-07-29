import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  LayoutDashboard, Upload, FileText, Sparkles, History, BarChart3,
  Database, UserRound, Settings as SettingsIcon, LifeBuoy, LogOut, Home, Moon, Sun,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

export function CommandPalette({ open, onOpenChange }: Props) {
  const nav = useNavigate();

  const go = (to: string) => {
    onOpenChange(false);
    nav({ to });
  };

  const toggleTheme = () => {
    const el = document.documentElement;
    el.classList.toggle("dark");
    onOpenChange(false);
  };

  const signOut = async () => {
    onOpenChange(false);
    await supabase.auth.signOut();
    toast.success("Signed out");
    nav({ to: "/" });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go("/dashboard")}><LayoutDashboard className="mr-2 h-4 w-4" />Overview<CommandShortcut>G O</CommandShortcut></CommandItem>
          <CommandItem onSelect={() => go("/dashboard/upload")}><Upload className="mr-2 h-4 w-4" />Upload audio<CommandShortcut>G U</CommandShortcut></CommandItem>
          <CommandItem onSelect={() => go("/dashboard/transcription")}><FileText className="mr-2 h-4 w-4" />Transcription</CommandItem>
          <CommandItem onSelect={() => go("/dashboard/summary")}><Sparkles className="mr-2 h-4 w-4" />Summary</CommandItem>
          <CommandItem onSelect={() => go("/dashboard/history")}><History className="mr-2 h-4 w-4" />History<CommandShortcut>G H</CommandShortcut></CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Workspace">
          <CommandItem onSelect={() => go("/dashboard/evaluation")}><BarChart3 className="mr-2 h-4 w-4" />Evaluation</CommandItem>
          <CommandItem onSelect={() => go("/dashboard/datasets")}><Database className="mr-2 h-4 w-4" />Datasets</CommandItem>
          <CommandItem onSelect={() => go("/dashboard/profile")}><UserRound className="mr-2 h-4 w-4" />Profile</CommandItem>
          <CommandItem onSelect={() => go("/dashboard/settings")}><SettingsIcon className="mr-2 h-4 w-4" />Settings</CommandItem>
          <CommandItem onSelect={() => go("/dashboard/help")}><LifeBuoy className="mr-2 h-4 w-4" />Help</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => go("/")}><Home className="mr-2 h-4 w-4" />Go to landing</CommandItem>
          <CommandItem onSelect={toggleTheme}><Sun className="mr-2 h-4 w-4 dark:hidden" /><Moon className="mr-2 hidden h-4 w-4 dark:block" />Toggle theme</CommandItem>
          <CommandItem onSelect={signOut}><LogOut className="mr-2 h-4 w-4" />Sign out</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);
  return { open, setOpen };
}
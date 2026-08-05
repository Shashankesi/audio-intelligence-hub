import { useEffect, useMemo, useState } from "react";
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
  Waves, Clock3, Star, Hash,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { recentSearches, recentlyViewed, useRecordings } from "@/lib/workspace";

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

type Hit = { id: string; name: string; where: string; snippet: string };

/** Full-text pass over transcripts, summaries, keywords and topics. */
function useContentSearch(term: string, enabled: boolean) {
  const q = term.trim();
  return useQuery({
    queryKey: ["global-search", q],
    enabled: enabled && q.length >= 2,
    staleTime: 20_000,
    queryFn: async (): Promise<Hit[]> => {
      const client = supabase as unknown as { from: (t: string) => any };
      const like = `%${q}%`;
      const [tr, sm] = await Promise.all([
        client.from("transcripts").select("recording_id, text, recordings(name)").ilike("text", like).limit(6),
        client
          .from("summaries")
          .select("recording_id, short_text, keywords, topics, recordings(name)")
          .or(`short_text.ilike.${like},detailed_text.ilike.${like},meeting_minutes.ilike.${like}`)
          .limit(6),
      ]);

      const hits: Hit[] = [];
      for (const row of tr.data ?? []) {
        const text: string = row.text ?? "";
        const at = text.toLowerCase().indexOf(q.toLowerCase());
        hits.push({
          id: row.recording_id,
          name: row.recordings?.name ?? "Recording",
          where: "Transcript",
          snippet: text.slice(Math.max(0, at - 40), Math.max(0, at - 40) + 120).trim(),
        });
      }
      for (const row of sm.data ?? []) {
        hits.push({
          id: row.recording_id,
          name: row.recordings?.name ?? "Recording",
          where: "Summary",
          snippet: (row.short_text ?? "").slice(0, 120),
        });
      }
      return hits;
    },
  });
}

export function CommandPalette({ open, onOpenChange }: Props) {
  const nav = useNavigate();
  const [term, setTerm] = useState("");
  const { data: recordings = [] } = useRecordings();
  const { data: hits = [], isFetching } = useContentSearch(term, open);
  const viewed = useMemo(() => (open ? recentlyViewed.all() : []), [open]);
  const searches = useMemo(() => (open ? recentSearches.all() : []), [open, term]);

  const q = term.trim().toLowerCase();
  const fileMatches = useMemo(() => {
    if (!q) return recordings.filter((r) => r.pinned || r.favorite).slice(0, 5);
    return recordings
      .filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.tags ?? []).some((t) => t.toLowerCase().includes(q)) ||
          (r.folder ?? "").toLowerCase().includes(q) ||
          new Date(r.created_at).toDateString().toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [recordings, q]);

  const go = (to: string) => {
    onOpenChange(false);
    nav({ to });
  };

  const openRecording = (id: string, name: string, to: string) => {
    recentSearches.push(term);
    recentlyViewed.push({ id, name });
    onOpenChange(false);
    nav({ to, search: { id } as never });
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
      <CommandInput
        value={term}
        onValueChange={setTerm}
        placeholder="Search meetings, transcripts, summaries, keywords…"
      />
      <CommandList>
        <CommandEmpty>{isFetching ? "Searching…" : "No results found."}</CommandEmpty>

        {fileMatches.length > 0 && (
          <CommandGroup heading={q ? "Meetings" : "Pinned & favorites"}>
            {fileMatches.map((r) => (
              <CommandItem key={r.id} value={`file-${r.id}-${r.name}`} onSelect={() => openRecording(r.id, r.name, "/dashboard/summary")}>
                {r.favorite ? <Star className="mr-2 h-4 w-4 text-amber-300" /> : <Waves className="mr-2 h-4 w-4" />}
                <span className="truncate">{r.name}</span>
                <CommandShortcut>{new Date(r.created_at).toLocaleDateString()}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {hits.length > 0 && (
          <CommandGroup heading="Inside content">
            {hits.map((h, i) => (
              <CommandItem
                key={`${h.id}-${h.where}-${i}`}
                value={`hit-${h.id}-${h.where}-${i}`}
                onSelect={() => openRecording(h.id, h.name, h.where === "Transcript" ? "/dashboard/transcription" : "/dashboard/summary")}
              >
                <Hash className="mr-2 h-4 w-4 text-fuchsia-300" />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium">{h.name} · {h.where}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{h.snippet}</span>
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!q && viewed.length > 0 && (
          <CommandGroup heading="Recently viewed">
            {viewed.slice(0, 5).map((v) => (
              <CommandItem key={v.id} value={`viewed-${v.id}`} onSelect={() => openRecording(v.id, v.name, "/dashboard/summary")}>
                <Clock3 className="mr-2 h-4 w-4" />
                <span className="truncate">{v.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!q && searches.length > 0 && (
          <CommandGroup heading="Recent searches">
            {searches.slice(0, 5).map((s) => (
              <CommandItem key={`s-${s}`} value={`search-${s}`} onSelect={() => setTerm(s)}>
                <History className="mr-2 h-4 w-4" />
                {s}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go("/dashboard")}><LayoutDashboard className="mr-2 h-4 w-4" />Overview<CommandShortcut>G O</CommandShortcut></CommandItem>
          <CommandItem onSelect={() => go("/dashboard/upload")}><Upload className="mr-2 h-4 w-4" />Upload audio<CommandShortcut>G U</CommandShortcut></CommandItem>
          <CommandItem onSelect={() => go("/dashboard/transcription")}><FileText className="mr-2 h-4 w-4" />Transcription</CommandItem>
          <CommandItem onSelect={() => go("/dashboard/summary")}><Sparkles className="mr-2 h-4 w-4" />Summary</CommandItem>
          <CommandItem onSelect={() => go("/dashboard/history")}><History className="mr-2 h-4 w-4" />History<CommandShortcut>G H</CommandShortcut></CommandItem>
          <CommandItem onSelect={() => go("/dashboard/analytics")}><BarChart3 className="mr-2 h-4 w-4" />Analytics<CommandShortcut>G A</CommandShortcut></CommandItem>
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
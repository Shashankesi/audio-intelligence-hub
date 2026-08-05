import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Recording = {
  id: string;
  name: string;
  storage_path: string;
  mime: string | null;
  size_bytes: number | null;
  duration_sec: number | null;
  language: string | null;
  model: string | null;
  status: string;
  error: string | null;
  pinned: boolean;
  favorite: boolean;
  archived: boolean;
  deleted_at: string | null;
  tags: string[];
  folder: string;
  notes: string;
  last_viewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AppNotification = {
  id: string;
  recording_id: string | null;
  kind: string;
  level: "info" | "success" | "warning" | "error";
  title: string;
  body: string;
  read: boolean;
  created_at: string;
};

const db = supabase as unknown as {
  from: (t: string) => any;
};

export function useRecordings() {
  return useQuery({
    queryKey: ["recordings"],
    queryFn: async () => {
      const r = await db.from("recordings").select("*").order("created_at", { ascending: false });
      if (r.error) throw r.error;
      return (r.data ?? []) as Recording[];
    },
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const r = await db
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(40);
      if (r.error) throw r.error;
      return (r.data ?? []) as AppNotification[];
    },
    refetchInterval: 30_000,
  });
}

/** Patch any recording columns and refresh the workspace caches. */
export function useRecordingPatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, patch }: { ids: string[]; patch: Partial<Recording> }) => {
      const r = await db.from("recordings").update(patch).in("id", ids);
      if (r.error) throw r.error;
      return ids;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recordings"] });
      qc.invalidateQueries({ queryKey: ["recordings-count"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useNotificationActions() {
  const qc = useQueryClient();
  const done = () => qc.invalidateQueries({ queryKey: ["notifications"] });
  return {
    markAllRead: async () => {
      await db.from("notifications").update({ read: true }).eq("read", false);
      done();
    },
    markRead: async (id: string) => {
      await db.from("notifications").update({ read: true }).eq("id", id);
      done();
    },
    clearAll: async () => {
      await db.from("notifications").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      done();
    },
  };
}

/* ---------- local workspace memory (recent searches / recently viewed) ---------- */

const LS_SEARCHES = "ai:recent-searches";
const LS_VIEWED = "ai:recently-viewed";

function readList<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value.slice(0, 12)));
  } catch {
    /* storage full or blocked */
  }
}

export const recentSearches = {
  all: () => readList<string>(LS_SEARCHES),
  push: (q: string) => {
    const term = q.trim();
    if (term.length < 2) return;
    writeList(LS_SEARCHES, [term, ...readList<string>(LS_SEARCHES).filter((s) => s !== term)]);
  },
  clear: () => writeList(LS_SEARCHES, []),
};

export type ViewedItem = { id: string; name: string; at: number };

export const recentlyViewed = {
  all: () => readList<ViewedItem>(LS_VIEWED),
  push: (item: { id: string; name: string }) => {
    writeList(LS_VIEWED, [
      { ...item, at: Date.now() },
      ...readList<ViewedItem>(LS_VIEWED).filter((v) => v.id !== item.id),
    ]);
  },
};

/* ---------- formatting ---------- */

export function formatBytes(bytes: number) {
  if (!bytes) return "0 MB";
  const mb = bytes / 1024 / 1024;
  return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`;
}

export function formatDuration(sec?: number | null) {
  if (!sec) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return h ? `${h}h ${m}m` : m ? `${m}m ${s}s` : `${s}s`;
}

/** Same name + near-identical size/duration means the file was probably uploaded twice. */
export function findDuplicates(rows: Recording[]) {
  const seen = new Map<string, string>();
  const dupes = new Set<string>();
  for (const r of [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    const key = `${r.name.trim().toLowerCase()}|${Math.round((r.duration_sec ?? 0) / 5)}`;
    const first = seen.get(key);
    if (first) dupes.add(r.id);
    else seen.set(key, r.id);
  }
  return dupes;
}
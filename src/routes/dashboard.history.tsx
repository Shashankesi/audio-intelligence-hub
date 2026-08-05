import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Search, Trash2, FileText, Sparkles, Star, Archive, ArchiveRestore, Pin,
  ChevronLeft, ChevronRight, Copy, Download, X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { deleteRecording } from "@/lib/audio.functions";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { findDuplicates, formatBytes, formatDuration, useRecordingPatch, useRecordings, type Recording } from "@/lib/workspace";

export const Route = createFileRoute("/dashboard/history")({ component: HistoryPage });

const PAGE_SIZE = 10;
type View = "all" | "favorites" | "archived";
type SortKey = "recent" | "oldest" | "name" | "largest" | "longest";

function HistoryPage() {
  const [q, setQ] = useState("");
  const [view, setView] = useState<View>("all");
  const [status, setStatus] = useState("any");
  const [sort, setSort] = useState<SortKey>("recent");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);

  const qc = useQueryClient();
  const del = useServerFn(deleteRecording);
  const patch = useRecordingPatch();
  const { data: rows = [], isLoading } = useRecordings();

  const duplicates = useMemo(() => findDuplicates(rows), [rows]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = rows.filter((r) => {
      if (view === "favorites" && !r.favorite) return false;
      if (view === "archived" ? !r.archived : r.archived) return false;
      if (status !== "any" && r.status !== status) return false;
      if (!term) return true;
      return (
        r.name.toLowerCase().includes(term) ||
        (r.tags ?? []).some((t) => t.toLowerCase().includes(term)) ||
        (r.folder ?? "").toLowerCase().includes(term)
      );
    });
    const by: Record<SortKey, (a: Recording, b: Recording) => number> = {
      recent: (a, b) => b.created_at.localeCompare(a.created_at),
      oldest: (a, b) => a.created_at.localeCompare(b.created_at),
      name: (a, b) => a.name.localeCompare(b.name),
      largest: (a, b) => (b.size_bytes ?? 0) - (a.size_bytes ?? 0),
      longest: (a, b) => (b.duration_sec ?? 0) - (a.duration_sec ?? 0),
    };
    list = [...list].sort(by[sort]);
    return [...list.filter((r) => r.pinned), ...list.filter((r) => !r.pinned)];
  }, [rows, q, view, status, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const delMut = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const recordingId of ids) await del({ data: { recordingId } });
    },
    onSuccess: (_d, ids) => {
      toast.success(`Deleted ${ids.length} recording${ids.length > 1 ? "s" : ""}`);
      setSelected([]);
      qc.invalidateQueries({ queryKey: ["recordings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulk = (p: Partial<Recording>, msg: string) =>
    patch.mutate({ ids: selected, patch: p }, { onSuccess: () => { toast.success(msg); setSelected([]); } });

  const exportCsv = () => {
    const target = selected.length ? filtered.filter((r) => selected.includes(r.id)) : filtered;
    const head = "name,status,duration_sec,size_bytes,model,created_at\n";
    const body = target
      .map((r) => [`"${r.name.replace(/"/g, '""')}"`, r.status, r.duration_sec ?? "", r.size_bytes ?? "", r.model ?? "", r.created_at].join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([head + body], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "audioinsight-history.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const allOnPage = pageRows.length > 0 && pageRows.every((r) => selected.includes(r.id));
  const toggleAll = () =>
    setSelected(allOnPage ? selected.filter((id) => !pageRows.some((r) => r.id === id)) : [...new Set([...selected, ...pageRows.map((r) => r.id)])]);

  const statusColor = (s: string) =>
    s === "done" ? "bg-emerald-500/15 text-emerald-300" : s === "failed" ? "bg-red-500/15 text-red-300" : "bg-amber-500/15 text-amber-300";

  return (
    <PageShell
      title="History"
      description="Search, organise and bulk-manage every meeting you've processed."
      actions={<Button asChild className="bg-gradient-brand text-white shadow-glow"><Link to="/dashboard/upload">New upload</Link></Button>}
    >
      <Card className="glass rounded-[28px] border-white/10">
        <CardContent className="p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="relative min-w-56 flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(0); }}
                placeholder="Search by name, tag or folder…"
                className="h-9 bg-white/5 pl-9"
                aria-label="Search recordings"
              />
            </div>
            <div className="flex rounded-xl border border-white/10 bg-white/5 p-0.5" role="tablist">
              {(["all", "favorites", "archived"] as View[]).map((v) => (
                <button
                  key={v}
                  role="tab"
                  aria-selected={view === v}
                  onClick={() => { setView(v); setPage(0); }}
                  className={`rounded-lg px-3 py-1.5 text-xs capitalize transition ${view === v ? "bg-gradient-brand text-white" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {v}
                </button>
              ))}
            </div>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
              <SelectTrigger className="h-9 w-36 bg-white/5"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {["any", "uploaded", "transcribed", "done", "failed"].map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s === "any" ? "Any status" : s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="h-9 w-36 bg-white/5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="name">Name A–Z</SelectItem>
                <SelectItem value="largest">Largest file</SelectItem>
                <SelectItem value="longest">Longest audio</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-9 border-white/10 bg-white/5" onClick={exportCsv}>
              <Download className="mr-2 h-4 w-4" /> CSV
            </Button>
          </div>

          {selected.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs">
              <span className="font-medium">{selected.length} selected</span>
              <Button size="sm" variant="ghost" className="h-7" onClick={() => bulk({ favorite: true }, "Added to favorites")}><Star className="mr-1 h-3.5 w-3.5" />Favorite</Button>
              <Button size="sm" variant="ghost" className="h-7" onClick={() => bulk({ archived: view !== "archived" }, view === "archived" ? "Restored" : "Archived")}>
                {view === "archived" ? <ArchiveRestore className="mr-1 h-3.5 w-3.5" /> : <Archive className="mr-1 h-3.5 w-3.5" />}
                {view === "archived" ? "Restore" : "Archive"}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-red-300" onClick={() => delMut.mutate(selected)} disabled={delMut.isPending}>
                <Trash2 className="mr-1 h-3.5 w-3.5" />Delete
              </Button>
              <Button size="sm" variant="ghost" className="ml-auto h-7" onClick={() => setSelected([])}><X className="mr-1 h-3.5 w-3.5" />Clear</Button>
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="w-8"><Checkbox checked={allOnPage} onCheckedChange={toggleAll} aria-label="Select all on page" /></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Duration</TableHead>
                  <TableHead className="hidden md:table-cell">Size</TableHead>
                  <TableHead className="hidden lg:table-cell">Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Loading…</TableCell></TableRow>}
                {!isLoading && pageRows.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Nothing here. <Link to="/dashboard/upload" className="text-foreground underline">Upload a recording</Link>.
                  </TableCell></TableRow>
                )}
                {pageRows.map((r) => (
                  <TableRow key={r.id} className="border-white/10">
                    <TableCell><Checkbox checked={selected.includes(r.id)} onCheckedChange={(v) => setSelected(v ? [...selected, r.id] : selected.filter((i) => i !== r.id))} aria-label={`Select ${r.name}`} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {r.pinned && <Pin className="h-3.5 w-3.5 shrink-0 text-cyan-300" />}
                        <Link to="/dashboard/summary" search={{ id: r.id } as never} className="max-w-[220px] truncate font-medium hover:underline">{r.name}</Link>
                        {duplicates.has(r.id) && <Badge variant="outline" className="border-amber-400/30 text-[10px] text-amber-300"><Copy className="mr-1 h-3 w-3" />dup</Badge>}
                      </div>
                      {(r.tags ?? []).length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {r.tags.slice(0, 3).map((t) => <span key={t} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">#{t}</span>)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground md:table-cell">{formatDuration(r.duration_sec)}</TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground md:table-cell">{r.size_bytes ? formatBytes(r.size_bytes) : "—"}</TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</TableCell>
                    <TableCell>
                      <span className={"rounded-full px-2 py-0.5 text-xs " + statusColor(r.status)}>{r.status}</span>
                      {r.error && <div className="mt-1 max-w-[200px] truncate text-[10px] text-red-300" title={r.error}>{r.error}</div>}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button size="icon" variant="ghost" aria-label="Toggle favorite" onClick={() => patch.mutate({ ids: [r.id], patch: { favorite: !r.favorite } })}>
                        <Star className={`h-4 w-4 ${r.favorite ? "fill-amber-300 text-amber-300" : ""}`} />
                      </Button>
                      <Button size="icon" variant="ghost" asChild aria-label="Open transcript"><Link to="/dashboard/transcription" search={{ id: r.id } as never}><FileText className="h-4 w-4" /></Link></Button>
                      <Button size="icon" variant="ghost" asChild aria-label="Open summary"><Link to="/dashboard/summary" search={{ id: r.id } as never}><Sparkles className="h-4 w-4" /></Link></Button>
                      <Button size="icon" variant="ghost" aria-label={r.archived ? "Restore" : "Archive"} onClick={() => patch.mutate({ ids: [r.id], patch: { archived: !r.archived } })}>
                        {r.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                      </Button>
                      <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => delMut.mutate([r.id])}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Showing {pageRows.length} of {filtered.length} · {rows.length} total</span>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Previous page" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <span>Page {safePage + 1} / {pages}</span>
              <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Next page" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}

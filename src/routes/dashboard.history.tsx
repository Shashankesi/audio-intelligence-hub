import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Trash2, FileText, Sparkles } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { deleteRecording } from "@/lib/audio.functions";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/dashboard/history")({ component: HistoryPage });

function HistoryPage() {
  const [q, setQ] = useState("");
  const qc = useQueryClient();
  const del = useServerFn(deleteRecording);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["recordings"],
    queryFn: async () => {
      const r = await (supabase.from("recordings") as any).select("*").order("created_at", { ascending: false });
      if (r.error) throw r.error;
      return r.data as any[];
    },
  });

  const delMut = useMutation({
    mutationFn: async (recordingId: string) => del({ data: { recordingId } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["recordings"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = rows.filter((r) => (r.name as string).toLowerCase().includes(q.toLowerCase()));
  const statusColor = (s: string) => s === "done" ? "bg-emerald-500/15 text-emerald-300" :
    s === "failed" ? "bg-red-500/15 text-red-300" : "bg-amber-500/15 text-amber-300";

  return (
    <PageShell title="History" description="All your recordings and generations.">
      <Card className="glass border-white/10">
        <CardContent className="p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-64">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search recordings…" className="h-9 bg-white/5 pl-9" />
            </div>
            <Button className="bg-gradient-brand text-white shadow-glow" asChild><Link to="/dashboard/upload">New upload</Link></Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10"><TableHead>Name</TableHead><TableHead>Size</TableHead><TableHead>Model</TableHead><TableHead>Created</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Loading…</TableCell></TableRow>}
              {!isLoading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">
                  No recordings yet. <Link to="/dashboard/upload" className="text-foreground underline">Upload your first</Link>.
                </TableCell></TableRow>
              )}
              {filtered.map((r) => (
                <TableRow key={r.id} className="border-white/10">
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.size_bytes ? `${(r.size_bytes / (1024 * 1024)).toFixed(2)} MB` : "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.model ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</TableCell>
                  <TableCell>
                    <span className={"rounded-full px-2 py-0.5 text-xs " + statusColor(r.status)}>{r.status}</span>
                    {r.error && <div className="mt-1 max-w-[220px] truncate text-[10px] text-red-300" title={r.error}>{r.error}</div>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" asChild title="Transcript"><Link to="/dashboard/transcription" search={{ id: r.id } as any}><FileText className="h-4 w-4" /></Link></Button>
                    <Button size="icon" variant="ghost" asChild title="Summary"><Link to="/dashboard/summary" search={{ id: r.id } as any}><Sparkles className="h-4 w-4" /></Link></Button>
                    <Button size="icon" variant="ghost" title="Delete" onClick={() => delMut.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-3 text-xs text-muted-foreground">Showing {filtered.length} of {rows.length}</div>
        </CardContent>
      </Card>
    </PageShell>
  );
}

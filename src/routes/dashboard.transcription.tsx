import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Download, Search, Save, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { updateTranscript } from "@/lib/audio.functions";
import { z } from "zod";

export const Route = createFileRoute("/dashboard/transcription")({
  validateSearch: z.object({ id: z.string().optional() }),
  component: Transcription,
});

function Transcription() {
  const { id } = Route.useSearch();
  const qc = useQueryClient();
  const save = useServerFn(updateTranscript);

  const { data, isLoading } = useQuery({
    queryKey: ["transcript", id],
    enabled: !!id,
    queryFn: async () => {
      const r = await (supabase.from("transcripts") as any).select("*, recordings(name,duration_sec,language,model)").eq("recording_id", id).single();
      if (r.error) throw r.error;
      return r.data as any;
    },
  });

  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => { if (data?.text != null) setText(data.text); }, [data?.text]);

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  const saveMut = useMutation({
    mutationFn: async () => save({ data: { recordingId: id!, text } }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["transcript", id] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const download = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = (data?.recordings?.name ?? "transcript") + ".txt"; a.click();
    URL.revokeObjectURL(url);
  };

  if (!id) return (
    <PageShell title="Transcription" description="Open a recording to view its transcript.">
      <Card className="glass border-white/10"><CardContent className="p-10 text-center text-sm text-muted-foreground">
        No recording selected. Head to <Link to="/dashboard/history" className="text-foreground underline">History</Link> or <Link to="/dashboard/upload" className="text-foreground underline">upload a new one</Link>.
      </CardContent></Card>
    </PageShell>
  );

  const highlighted = q
    ? text.replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"), "«$1»")
    : text;

  return (
    <PageShell
      title="Transcription"
      description={data?.recordings?.name || "Edit, search and export your transcript."}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-white/15 bg-white/5" asChild><Link to="/dashboard/summary" search={{ id } as any}><Sparkles className="mr-2 h-4 w-4" /> View summary</Link></Button>
          <Button variant="outline" className="border-white/15 bg-white/5" onClick={() => { navigator.clipboard.writeText(text); toast.success("Copied"); }}><Copy className="mr-2 h-4 w-4" /> Copy</Button>
          <Button variant="outline" className="border-white/15 bg-white/5" onClick={download}><Download className="mr-2 h-4 w-4" /> TXT</Button>
          <Button disabled={saveMut.isPending} className="bg-gradient-brand text-white shadow-glow" onClick={() => saveMut.mutate()}><Save className="mr-2 h-4 w-4" /> Save</Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="glass border-white/10 lg:col-span-2">
          <CardContent className="p-5">
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search transcript…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 bg-white/5 pl-9" />
            </div>
            {isLoading ? (
              <div className="grid min-h-[420px] place-items-center text-sm text-muted-foreground">Loading transcript…</div>
            ) : (
              <Textarea value={q ? highlighted : text} onChange={(e) => setText(e.target.value)} className="min-h-[420px] resize-y bg-white/[0.02] font-mono text-sm leading-relaxed" />
            )}
          </CardContent>
        </Card>
        <Card className="glass border-white/10">
          <CardContent className="space-y-4 p-5 text-sm">
            <Stat label="Word count" value={words.toString()} />
            <Stat label="Characters" value={text.length.toString()} />
            <Stat label="Language" value={(data?.recordings?.language ?? "auto").toUpperCase()} />
            <Stat label="Model" value={data?.model ?? "—"} />
            <Stat label="Latency" value={data?.latency_ms ? `${data.latency_ms} ms` : "—"} />
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

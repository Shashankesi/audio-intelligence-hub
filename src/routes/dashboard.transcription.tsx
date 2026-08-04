import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Download, Search, Save, Sparkles, Check, Pencil, ListTree, MessagesSquare } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { updateTranscript } from "@/lib/audio.functions";
import { z } from "zod";
import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { TranscriptView, type Segment } from "@/components/audio/TranscriptView";
import { TranscriptChat } from "@/components/audio/TranscriptChat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatClock } from "@/lib/audio-source";

export const Route = createFileRoute("/dashboard/transcription")({
  validateSearch: z.object({ id: z.string().optional(), t: z.number().optional() }),
  component: Transcription,
  head: () => ({
    meta: [
      { title: "Transcript — AudioInsight AI" },
      { name: "description", content: "Timestamped, searchable meeting transcript synced to audio playback." },
      { property: "og:title", content: "Transcript — AudioInsight AI" },
      { property: "og:description", content: "Timestamped meeting transcript with playback sync and AI chat." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Transcription() {
  const { id, t: startAt } = Route.useSearch();
  const qc = useQueryClient();
  const save = useServerFn(updateTranscript);

  const { data, isLoading } = useQuery({
    queryKey: ["transcript", id],
    enabled: !!id,
    queryFn: async () => {
      const r = await (supabase.from("transcripts") as any)
        .select("*, recordings(name,duration_sec,language,model,storage_path)")
        .eq("recording_id", id)
        .single();
      if (r.error) throw r.error;
      return r.data as any;
    },
  });

  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [time, setTime] = useState(0);
  const seekRef = useRef<((t: number) => void) | null>(null);
  const registerSeek = useCallback((fn: (t: number) => void) => {
    seekRef.current = fn;
  }, []);

  useEffect(() => {
    if (data?.text != null) setText(data.text);
  }, [data?.text]);

  useEffect(() => {
    if (startAt != null && seekRef.current) seekRef.current(startAt);
  }, [startAt, data]);

  const segments: Segment[] = Array.isArray(data?.segments) ? (data.segments as Segment[]) : [];
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  const saveMut = useMutation({
    mutationFn: async () => save({ data: { recordingId: id!, text } }),
    onSuccess: () => {
      toast.success("Transcript saved");
      qc.invalidateQueries({ queryKey: ["transcript", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const download = (kind: "txt" | "srt" | "md") => {
    const name = data?.recordings?.name ?? "transcript";
    let body = text;
    let mime = "text/plain";
    if (kind === "srt" && segments.length) {
      const stamp = (s: number) =>
        `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")},${String(Math.round((s % 1) * 1000)).padStart(3, "0")}`;
      body = segments.map((s, i) => `${i + 1}\n${stamp(s.start)} --> ${stamp(s.end)}\n${s.text}\n`).join("\n");
    }
    if (kind === "md") {
      mime = "text/markdown";
      body = segments.length
        ? `# ${name}\n\n` + segments.map((s) => `**[${formatClock(s.start)}]** ${s.text}`).join("\n\n")
        : `# ${name}\n\n${text}`;
    }
    const url = URL.createObjectURL(new Blob([body], { type: mime }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.${kind}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Transcript copied");
    setTimeout(() => setCopied(false), 1600);
  };

  if (!id)
    return (
      <PageShell title="Transcription" description="Open a recording to view its transcript.">
        <Card className="glass border-white/10">
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            No recording selected. Head to{" "}
            <Link to="/dashboard/history" className="text-foreground underline">
              History
            </Link>{" "}
            or{" "}
            <Link to="/dashboard/upload" className="text-foreground underline">
              upload a new one
            </Link>
            .
          </CardContent>
        </Card>
      </PageShell>
    );

  return (
    <PageShell
      title="Transcription"
      description={data?.recordings?.name || "Edit, search and export your transcript."}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="border-white/15 bg-white/5" asChild>
            <Link to="/dashboard/summary" search={{ id } as any}>
              <Sparkles className="mr-2 h-4 w-4" /> Summary
            </Link>
          </Button>
          <Button variant="outline" className="border-white/15 bg-white/5" onClick={copy}>
            {copied ? <Check className="mr-2 h-4 w-4 text-emerald-300" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="outline" className="border-white/15 bg-white/5" onClick={() => download("txt")}>
            <Download className="mr-2 h-4 w-4" /> TXT
          </Button>
          {segments.length > 0 && (
            <Button variant="outline" className="border-white/15 bg-white/5" onClick={() => download("srt")}>
              <Download className="mr-2 h-4 w-4" /> SRT
            </Button>
          )}
          <Button variant="outline" className="border-white/15 bg-white/5" onClick={() => download("md")}>
            <Download className="mr-2 h-4 w-4" /> MD
          </Button>
          <Button
            variant={editing ? "default" : "outline"}
            className={editing ? "bg-gradient-brand text-white shadow-glow" : "border-white/15 bg-white/5"}
            onClick={() => setEditing((v) => !v)}
          >
            <Pencil className="mr-2 h-4 w-4" /> {editing ? "Reading view" : "Edit"}
          </Button>
          {editing && (
            <Button disabled={saveMut.isPending} className="bg-gradient-brand text-white shadow-glow" onClick={() => saveMut.mutate()}>
              <Save className="mr-2 h-4 w-4" /> Save
            </Button>
          )}
        </div>
      }
    >
      <AudioPlayer
        storagePath={data?.recordings?.storage_path}
        totalDuration={Number(data?.recordings?.duration_sec) || 0}
        onTime={setTime}
        registerSeek={registerSeek}
        className="mb-6"
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="glass border-white/10 xl:col-span-2">
          <CardContent className="p-5">
            <div className="relative mb-4">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transcript…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Search transcript"
                className="h-9 bg-white/5 pl-9"
              />
            </div>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-xl bg-white/[0.04]" />
                ))}
              </div>
            ) : editing ? (
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                aria-label="Transcript editor"
                className="min-h-[62vh] resize-y bg-white/[0.02] font-mono text-sm leading-relaxed"
              />
            ) : (
              <TranscriptView segments={segments} plainText={text} query={q} currentTime={time} onSeek={(t) => seekRef.current?.(t)} />
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="glass border-white/10">
            <CardContent className="space-y-3 p-5 text-sm">
              <Stat label="Words" value={words.toLocaleString()} />
              <Stat label="Segments" value={segments.length ? segments.length.toString() : "—"} />
              <Stat label="Duration" value={data?.recordings?.duration_sec ? formatClock(Number(data.recordings.duration_sec)) : "—"} />
              <Stat label="Language" value={(data?.recordings?.language ?? "auto").toUpperCase()} />
              <Stat label="Latency" value={data?.latency_ms ? `${(data.latency_ms / 1000).toFixed(1)} s` : "—"} />
            </CardContent>
          </Card>

          <Card className="glass border-white/10">
            <CardContent className="p-5">
              <Tabs defaultValue="chat">
                <TabsList className="border border-white/10 bg-white/5">
                  <TabsTrigger value="chat" className="data-[state=active]:bg-gradient-brand data-[state=active]:text-white">
                    <MessagesSquare className="mr-1.5 h-3.5 w-3.5" /> Ask AI
                  </TabsTrigger>
                  <TabsTrigger value="jump" className="data-[state=active]:bg-gradient-brand data-[state=active]:text-white">
                    <ListTree className="mr-1.5 h-3.5 w-3.5" /> Jump
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="chat" className="mt-4">
                  <TranscriptChat recordingId={id} />
                </TabsContent>
                <TabsContent value="jump" className="mt-4">
                  {segments.length ? (
                    <div className="max-h-[46vh] space-y-1 overflow-auto pr-1">
                      {segments
                        .filter((_, i) => i % Math.max(1, Math.round(segments.length / 24)) === 0)
                        .map((s, i) => (
                          <button
                            key={i}
                            onClick={() => seekRef.current?.(s.start)}
                            className="flex w-full gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition hover:bg-white/5"
                          >
                            <span className="font-mono tabular-nums text-fuchsia-300">{formatClock(s.start)}</span>
                            <span className="line-clamp-1 text-muted-foreground">{s.text}</span>
                          </button>
                        ))}
                    </div>
                  ) : (
                    <p className="py-6 text-center text-xs text-muted-foreground">
                      Timestamps aren't available for this recording. Re-transcribe it to generate them.
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

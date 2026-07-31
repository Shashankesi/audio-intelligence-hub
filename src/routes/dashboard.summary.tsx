import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Share2, RefreshCw, FileText } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { summarizeRecording } from "@/lib/audio.functions";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const Route = createFileRoute("/dashboard/summary")({
  validateSearch: z.object({ id: z.string().optional() }),
  component: SummaryPage,
  head: () => ({
    meta: [
      { title: "Meeting Summary — AudioInsight AI" },
      { name: "description", content: "Executive summary, decisions, action items, topics and sentiment extracted from your meeting audio." },
      { property: "og:title", content: "Meeting Summary — AudioInsight AI" },
      { property: "og:description", content: "AI-generated meeting insights: decisions, action items and sentiment." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function SummaryPage() {
  const { id } = Route.useSearch();
  const qc = useQueryClient();
  const summarize = useServerFn(summarizeRecording);

  const { data, isLoading } = useQuery({
    queryKey: ["summary", id],
    enabled: !!id,
    queryFn: async () => {
      const r = await (supabase.from("summaries") as any).select("*, recordings(name)").eq("recording_id", id).maybeSingle();
      if (r.error) throw r.error;
      return r.data as any;
    },
  });

  const regen = useMutation({
    mutationFn: async () => summarize({ data: { recordingId: id! } }),
    onSuccess: () => { toast.success("Summary regenerated"); qc.invalidateQueries({ queryKey: ["summary", id] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!id) return (
    <PageShell title="Summary" description="Open a recording to view its summary.">
      <Card className="glass border-white/10"><CardContent className="p-10 text-center text-sm text-muted-foreground">
        No recording selected. Head to <Link to="/dashboard/history" className="text-foreground underline">History</Link>.
      </CardContent></Card>
    </PageShell>
  );

  const copy = () => { navigator.clipboard.writeText(data?.detailed_text || data?.short_text || ""); toast.success("Copied"); };

  const sentiment = data?.sentiment as { label: string; score: number; rationale: string } | undefined;
  const s = sentiment?.score ?? 0;
  const positive = Math.max(0, Math.round(s * 100));
  const negative = Math.max(0, Math.round(-s * 100));
  const neutral = Math.max(0, 100 - positive - negative);

  return (
    <PageShell
      title="Summary"
      description={data?.recordings?.name || "AI-generated insights."}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" className="border-white/15 bg-white/5" asChild><Link to="/dashboard/transcription" search={{ id } as any}><FileText className="mr-2 h-4 w-4" /> Transcript</Link></Button>
          <Button variant="outline" className="border-white/15 bg-white/5" onClick={copy}><Copy className="mr-2 h-4 w-4" /> Copy</Button>
          <Button variant="outline" className="border-white/15 bg-white/5" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied"); }}><Share2 className="mr-2 h-4 w-4" /> Share</Button>
          <Button disabled={regen.isPending} className="bg-gradient-brand text-white shadow-glow" onClick={() => regen.mutate()}><RefreshCw className={"mr-2 h-4 w-4 " + (regen.isPending ? "animate-spin" : "")} /> Regenerate</Button>
        </div>
      }
    >
      {isLoading ? (
        <Card className="glass border-white/10"><CardContent className="p-10 text-center text-sm text-muted-foreground">Loading summary…</CardContent></Card>
      ) : !data ? (
        <Card className="glass border-white/10"><CardContent className="p-10 text-center text-sm text-muted-foreground">
          No summary yet. <Button size="sm" variant="link" onClick={() => regen.mutate()} className="px-1 text-foreground">Generate now</Button>
        </CardContent></Card>
      ) : (
      <Tabs defaultValue="short">
        <TabsList className="border border-white/10 bg-white/5 backdrop-blur">
          {[
            ["short", "Short"], ["detailed", "Detailed"], ["bullets", "Key points"],
            ["actions", "Action items"], ["topics", "Topics"], ["sentiment", "Sentiment"],
          ].map(([v, l]) => (
            <TabsTrigger key={v} value={v} className="data-[state=active]:bg-gradient-brand data-[state=active]:text-white">{l}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="short" className="mt-6">
          <Card className="glass relative overflow-hidden border-white/10">
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-brand opacity-20 blur-3xl" />
            <CardContent className="relative p-6 md:p-8">
              <div className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Executive summary</div>
              <p className="text-base leading-relaxed md:text-lg">{data.short_text}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {(data.topics ?? []).slice(0, 6).map((t: string) => <Badge key={t} className="bg-white/10 text-foreground">{t}</Badge>)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="detailed" className="mt-6">
          <Card className="glass border-white/10"><CardContent className="p-6 md:p-8">
            <div className="prose-summary max-w-none text-sm leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.detailed_text || ""}</ReactMarkdown>
            </div>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="bullets" className="mt-6">
          <Card className="glass border-white/10"><CardContent className="p-6">
            <ul className="grid gap-2.5 md:grid-cols-2">
              {(data.key_points ?? []).map((k: string, i: number) => (
                <li key={i} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gradient-brand text-[10px] font-bold text-white">{i + 1}</span>
                  <span>{k}</span>
                </li>
              ))}
            </ul>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="actions" className="mt-6">
          <Card className="glass border-white/10"><CardContent className="p-6 space-y-2 text-sm">
            {(data.action_items ?? []).length === 0 && <div className="text-muted-foreground">No action items identified.</div>}
            {(data.action_items ?? []).map((a: any, i: number) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                <span>{a.text}</span>{a.owner && <Badge className="bg-gradient-brand text-white">{a.owner}</Badge>}
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="topics" className="mt-6">
          <Card className="glass border-white/10"><CardContent className="p-6 flex flex-wrap gap-2">
            {(data.topics ?? []).map((t: string) => <Badge key={t} className="bg-white/10 text-foreground">{t}</Badge>)}
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="sentiment" className="mt-6">
          <Card className="glass border-white/10"><CardContent className="p-6 space-y-3 text-sm">
            {sentiment && <div className="mb-2 text-muted-foreground">Overall <span className="text-foreground font-medium">{sentiment.label}</span> — {sentiment.rationale}</div>}
            {[["Positive", positive], ["Neutral", neutral], ["Negative", negative]].map(([k, v]) => (
              <div key={k as string}>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>{k}</span><span>{v}%</span></div>
                <div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-gradient-brand" style={{ width: v + "%" }} /></div>
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
      )}
    </PageShell>
  );
}

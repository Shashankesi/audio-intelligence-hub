import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Copy, Share2, RefreshCw, FileText, Download, ListChecks, Tags, Gauge, ShieldAlert, CalendarClock, Quote, GitBranch, Lightbulb, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { summarizeRecording, updateActionItems } from "@/lib/audio.functions";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { downloadSummaryPdf } from "@/lib/summary-pdf";
import { motion } from "framer-motion";
import { TranscriptChat } from "@/components/audio/TranscriptChat";
import { cn } from "@/lib/utils";

type ActionItem = {
  text: string;
  owner: string | null;
  deadline: string | null;
  priority: "high" | "medium" | "low";
  status: "open" | "in_progress" | "done";
};

export const Route = createFileRoute("/dashboard/summary")({
  validateSearch: z.object({ id: z.string().optional() }),
  component: SummaryPage,
  head: () => ({
    meta: [
      { title: "Meeting Summary — AudioInsight AI" },
      { name: "description", content: "Executive summary, minutes, decisions, action items, risks, timeline and sentiment from your meeting audio." },
      { property: "og:title", content: "Meeting Summary — AudioInsight AI" },
      { property: "og:description", content: "AI meeting intelligence: decisions, owners, deadlines, risks and sentiment." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-red-400/15 text-red-200 border-red-400/25",
  medium: "bg-amber-400/15 text-amber-200 border-amber-400/25",
  low: "bg-emerald-400/15 text-emerald-200 border-emerald-400/25",
};
const STATUS_NEXT: Record<ActionItem["status"], ActionItem["status"]> = {
  open: "in_progress",
  in_progress: "done",
  done: "open",
};

function SummaryPage() {
  const { id } = Route.useSearch();
  const qc = useQueryClient();
  const summarize = useServerFn(summarizeRecording);
  const saveItems = useServerFn(updateActionItems);

  const { data, isLoading } = useQuery({
    queryKey: ["summary", id],
    enabled: !!id,
    queryFn: async () => {
      const r = await (supabase.from("summaries") as any).select("*, recordings(name,duration_sec)").eq("recording_id", id).maybeSingle();
      if (r.error) throw r.error;
      return r.data as any;
    },
  });

  const [items, setItems] = useState<ActionItem[]>([]);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (data?.action_items) {
      setItems(
        (data.action_items as any[]).map((a) => ({
          text: a.text ?? "",
          owner: a.owner ?? null,
          deadline: a.deadline ?? null,
          priority: a.priority ?? "medium",
          status: a.status ?? "open",
        })),
      );
      setDirty(false);
    }
  }, [data?.action_items]);

  const regen = useMutation({
    mutationFn: async () => summarize({ data: { recordingId: id! } }),
    onSuccess: () => {
      toast.success("Summary regenerated");
      qc.invalidateQueries({ queryKey: ["summary", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const persistItems = useMutation({
    mutationFn: async () => saveItems({ data: { recordingId: id!, items } }),
    onSuccess: () => {
      setDirty(false);
      toast.success("Action items saved");
      qc.invalidateQueries({ queryKey: ["summary", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!id)
    return (
      <PageShell title="Summary" description="Open a recording to view its summary.">
        <Card className="glass border-white/10">
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            No recording selected. Head to{" "}
            <Link to="/dashboard/history" className="text-foreground underline">
              History
            </Link>
            .
          </CardContent>
        </Card>
      </PageShell>
    );

  const copy = () => {
    navigator.clipboard.writeText(data?.detailed_text || data?.short_text || "");
    toast.success("Copied");
  };

  const exportPdf = () => {
    if (!data) return;
    try {
      downloadSummaryPdf({
        title: data?.recordings?.name || "Meeting Summary",
        createdAt: data?.created_at,
        short_text: data?.short_text,
        detailed_text: data?.detailed_text,
        key_points: data?.key_points ?? [],
        action_items: items,
        topics: data?.topics ?? [],
        sentiment: data?.sentiment ?? null,
      });
      toast.success("PDF downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not build the PDF");
    }
  };

  const sentiment = data?.sentiment as { label: string; score: number; rationale: string } | undefined;
  const s = sentiment?.score ?? 0;
  const positive = Math.max(0, Math.round(s * 100));
  const negative = Math.max(0, Math.round(-s * 100));
  const neutral = Math.max(0, 100 - positive - negative);
  const arr = (k: string): any[] => (Array.isArray(data?.[k]) ? data[k] : []);
  const confidence = typeof data?.confidence === "number" ? Math.round(data.confidence * 100) : null;

  return (
    <PageShell
      title="Meeting intelligence"
      description={data?.recordings?.name || "AI-generated insights."}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="border-white/15 bg-white/5" asChild>
            <Link to="/dashboard/transcription" search={{ id } as any}>
              <FileText className="mr-2 h-4 w-4" /> Transcript
            </Link>
          </Button>
          <Button variant="outline" className="border-white/15 bg-white/5" onClick={copy}>
            <Copy className="mr-2 h-4 w-4" /> Copy
          </Button>
          <Button
            variant="outline"
            className="border-white/15 bg-white/5"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link copied");
            }}
          >
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
          <Button variant="outline" disabled={!data} className="border-white/15 bg-white/5" onClick={exportPdf}>
            <Download className="mr-2 h-4 w-4" /> PDF
          </Button>
          <Button disabled={regen.isPending} className="bg-gradient-brand text-white shadow-glow" onClick={() => regen.mutate()}>
            <RefreshCw className={"mr-2 h-4 w-4 " + (regen.isPending ? "animate-spin" : "")} /> Regenerate
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-3xl bg-white/[0.04]" />
          ))}
        </div>
      ) : !data ? (
        <Card className="glass border-white/10">
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            No summary yet.
            <Button size="sm" variant="link" onClick={() => regen.mutate()} className="px-1 text-foreground">
              Generate now
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ListChecks, label: "Action items", value: items.length },
              { icon: GitBranch, label: "Decisions", value: arr("decisions").length },
              { icon: Gauge, label: "Sentiment", value: sentiment?.label ?? "—" },
              { icon: Sparkles, label: "Confidence", value: confidence != null ? `${confidence}%` : "—" },
            ].map((m, i) => (
              <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="glass border-white/10">
                  <CardContent className="flex items-center gap-3 p-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-brand text-white">
                      <m.icon className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{m.label}</div>
                      <div className="text-lg font-semibold capitalize">{m.value}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Tabs defaultValue="short">
            <div className="-mx-1 overflow-x-auto pb-1">
              <TabsList className="border border-white/10 bg-white/5 backdrop-blur">
                {[
                  ["short", "Executive"],
                  ["detailed", "Detailed"],
                  ["minutes", "Minutes"],
                  ["bullets", "Bullets"],
                  ["actions", "Actions"],
                  ["timeline", "Timeline"],
                  ["decisions", "Decisions"],
                  ["risks", "Risks"],
                  ["deadlines", "Deadlines"],
                  ["quotes", "Quotes"],
                  ["topics", "Topics"],
                  ["sentiment", "Sentiment"],
                  ["chat", "Ask AI"],
                ].map(([v, l]) => (
                  <TabsTrigger key={v} value={v} className="data-[state=active]:bg-gradient-brand data-[state=active]:text-white">
                    {l}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="short" className="mt-6">
              <Card className="glass relative overflow-hidden border-white/10">
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-brand opacity-20 blur-3xl" />
                <CardContent className="relative p-6 md:p-8">
                  <div className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Executive summary</div>
                  <p className="text-base leading-relaxed md:text-lg">{data.short_text}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {arr("topics").slice(0, 6).map((t: string) => (
                      <Badge key={t} className="bg-white/10 text-foreground">{t}</Badge>
                    ))}
                  </div>
                  {arr("suggestions").length > 0 && (
                    <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        <Lightbulb className="h-3.5 w-3.5 text-amber-300" /> AI suggestions
                      </div>
                      <ul className="space-y-1.5 text-sm">
                        {arr("suggestions").map((x: string, i: number) => (
                          <li key={i} className="flex gap-2"><span className="text-fuchsia-300">→</span>{x}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="detailed" className="mt-6">
              <Card className="glass border-white/10">
                <CardContent className="p-6 md:p-8">
                  <div className="prose-summary max-w-none text-sm leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.detailed_text || ""}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="minutes" className="mt-6">
              <Card className="glass border-white/10">
                <CardContent className="p-6 md:p-8">
                  {data.meeting_minutes ? (
                    <div className="prose-summary max-w-none text-sm leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.meeting_minutes}</ReactMarkdown>
                    </div>
                  ) : (
                    <Empty text="Minutes weren't generated for this recording. Regenerate the summary to create them." />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bullets" className="mt-6">
              <Card className="glass border-white/10">
                <CardContent className="grid gap-6 p-6 lg:grid-cols-2">
                  <div>
                    <SectionTitle>Quick bullets</SectionTitle>
                    <ul className="space-y-2 text-sm">
                      {(arr("bullet_points").length ? arr("bullet_points") : arr("key_points")).map((k: string, i: number) => (
                        <li key={i} className="flex gap-2"><span className="text-fuchsia-300">•</span>{k}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <SectionTitle>Key points</SectionTitle>
                    <ul className="grid gap-2.5">
                      {arr("key_points").map((k: string, i: number) => (
                        <li key={i} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gradient-brand text-[10px] font-bold text-white">{i + 1}</span>
                          <span>{k}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="actions" className="mt-6">
              <Card className="glass border-white/10">
                <CardContent className="p-6">
                  {items.length === 0 ? (
                    <Empty text="No action items identified in this meeting." />
                  ) : (
                    <div className="space-y-2">
                      {items.map((a, i) => (
                        <div key={i} className="grid gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 md:grid-cols-[1fr_auto] md:items-center">
                          <div className="space-y-2">
                            <Input
                              value={a.text}
                              aria-label={`Task ${i + 1}`}
                              onChange={(e) => {
                                const next = [...items];
                                next[i] = { ...a, text: e.target.value };
                                setItems(next);
                                setDirty(true);
                              }}
                              className="h-9 border-transparent bg-transparent px-0 text-sm focus-visible:border-white/20 focus-visible:px-3"
                            />
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <Input
                                value={a.owner ?? ""}
                                placeholder="Owner"
                                aria-label="Owner"
                                onChange={(e) => {
                                  const next = [...items];
                                  next[i] = { ...a, owner: e.target.value || null };
                                  setItems(next);
                                  setDirty(true);
                                }}
                                className="h-7 w-32 bg-white/5 text-xs"
                              />
                              <Input
                                value={a.deadline ?? ""}
                                placeholder="Deadline"
                                aria-label="Deadline"
                                onChange={(e) => {
                                  const next = [...items];
                                  next[i] = { ...a, deadline: e.target.value || null };
                                  setItems(next);
                                  setDirty(true);
                                }}
                                className="h-7 w-36 bg-white/5 text-xs"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 justify-self-start md:justify-self-end">
                            <button
                              onClick={() => {
                                const order: ActionItem["priority"][] = ["high", "medium", "low"];
                                const next = [...items];
                                next[i] = { ...a, priority: order[(order.indexOf(a.priority) + 1) % 3] };
                                setItems(next);
                                setDirty(true);
                              }}
                              className={cn("rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize transition", PRIORITY_STYLES[a.priority])}
                            >
                              {a.priority}
                            </button>
                            <button
                              onClick={() => {
                                const next = [...items];
                                next[i] = { ...a, status: STATUS_NEXT[a.status] };
                                setItems(next);
                                setDirty(true);
                              }}
                              className={cn(
                                "rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize transition",
                                a.status === "done"
                                  ? "border-emerald-400/25 bg-emerald-400/15 text-emerald-200"
                                  : a.status === "in_progress"
                                    ? "border-sky-400/25 bg-sky-400/15 text-sky-200"
                                    : "border-white/15 bg-white/5 text-muted-foreground",
                              )}
                            >
                              {a.status.replace("_", " ")}
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-2">
                        <p className="text-xs text-muted-foreground">Click priority or status to cycle. Edits are saved to your workspace.</p>
                        <Button size="sm" disabled={!dirty || persistItems.isPending} onClick={() => persistItems.mutate()} className="bg-gradient-brand text-white shadow-glow">
                          <Save className="mr-2 h-3.5 w-3.5" /> Save changes
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="mt-6">
              <Card className="glass border-white/10">
                <CardContent className="p-6">
                  {arr("timeline").length === 0 ? (
                    <Empty text="No timeline available. Regenerate the summary to build one." />
                  ) : (
                    <ol className="relative space-y-5 border-l border-white/10 pl-6">
                      {arr("timeline").map((e: any, i: number) => (
                        <li key={i} className="relative">
                          <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-gradient-brand shadow-glow" />
                          <Link
                            to="/dashboard/transcription"
                            search={{ id, t: toSeconds(e.time) } as any}
                            className="font-mono text-xs text-fuchsia-300 hover:underline"
                          >
                            {e.time}
                          </Link>
                          <div className="text-sm font-semibold">{e.title}</div>
                          <p className="text-sm text-muted-foreground">{e.detail}</p>
                        </li>
                      ))}
                    </ol>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="decisions" className="mt-6">
              <Card className="glass border-white/10">
                <CardContent className="space-y-3 p-6">
                  {arr("decisions").length === 0 ? (
                    <Empty text="No explicit decisions were recorded." />
                  ) : (
                    arr("decisions").map((d: any, i: number) => (
                      <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex gap-2 text-sm font-medium"><GitBranch className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />{d.text}</div>
                        {d.rationale && <p className="mt-1.5 pl-6 text-xs text-muted-foreground">{d.rationale}</p>}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="risks" className="mt-6">
              <Card className="glass border-white/10">
                <CardContent className="space-y-3 p-6">
                  {arr("risks").length === 0 ? (
                    <Empty text="No risks or blockers were raised." />
                  ) : (
                    arr("risks").map((r: any, i: number) => (
                      <div key={i} className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
                        <span className="flex gap-2"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />{r.text}</span>
                        <Badge className={cn("shrink-0 border capitalize", PRIORITY_STYLES[r.severity ?? "medium"])}>{r.severity}</Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deadlines" className="mt-6">
              <Card className="glass border-white/10">
                <CardContent className="space-y-3 p-6">
                  {arr("deadlines").length === 0 ? (
                    <Empty text="No dated commitments were mentioned." />
                  ) : (
                    arr("deadlines").map((d: any, i: number) => (
                      <div key={i} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
                        <span className="flex gap-2"><CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />{d.label}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {d.date ?? "date not stated"}{d.owner ? ` · ${d.owner}` : ""}
                        </span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quotes" className="mt-6">
              <Card className="glass border-white/10">
                <CardContent className="grid gap-3 p-6 md:grid-cols-2">
                  {arr("quotes").length === 0 ? (
                    <Empty text="No standout quotes were captured." />
                  ) : (
                    arr("quotes").map((q: any, i: number) => (
                      <blockquote key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <Quote className="mb-2 h-4 w-4 text-fuchsia-300" />
                        <p className="text-sm italic leading-relaxed">“{q.text}”</p>
                        <footer className="mt-2 text-xs text-muted-foreground">
                          {q.speaker ?? "Unattributed"}
                          {q.time && q.time !== "--:--" && (
                            <Link to="/dashboard/transcription" search={{ id, t: toSeconds(q.time) } as any} className="ml-2 font-mono text-fuchsia-300 hover:underline">
                              {q.time}
                            </Link>
                          )}
                        </footer>
                      </blockquote>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="topics" className="mt-6">
              <Card className="glass border-white/10">
                <CardContent className="space-y-5 p-6">
                  <div>
                    <SectionTitle>Topics</SectionTitle>
                    <div className="flex flex-wrap gap-2">
                      {arr("topics").map((t: string) => (
                        <Badge key={t} className="bg-gradient-brand text-white">{t}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <SectionTitle><Tags className="mr-1.5 inline h-3.5 w-3.5" />Keywords</SectionTitle>
                    <div className="flex flex-wrap gap-2">
                      {arr("keywords").length ? (
                        arr("keywords").map((t: string) => <Badge key={t} className="bg-white/10 text-foreground">{t}</Badge>)
                      ) : (
                        <Empty text="No keywords extracted." />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sentiment" className="mt-6">
              <Card className="glass border-white/10">
                <CardContent className="space-y-3 p-6 text-sm">
                  {sentiment && (
                    <div className="mb-2 text-muted-foreground">
                      Overall <span className="font-medium text-foreground">{sentiment.label}</span> — {sentiment.rationale}
                    </div>
                  )}
                  {[["Positive", positive], ["Neutral", neutral], ["Negative", negative]].map(([k, v]) => (
                    <div key={k as string}>
                      <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>{k}</span><span>{v}%</span></div>
                      <div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-gradient-brand" style={{ width: v + "%" }} /></div>
                    </div>
                  ))}
                  {confidence != null && (
                    <p className="pt-2 text-xs text-muted-foreground">
                      Analysis confidence: <span className="font-semibold text-foreground">{confidence}%</span> — based on transcript quality and completeness.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chat" className="mt-6">
              <Card className="glass border-white/10">
                <CardContent className="p-6">
                  <TranscriptChat recordingId={id} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </PageShell>
  );
}

function toSeconds(time?: string | null) {
  if (!time) return 0;
  const m = /^(\d+):(\d{1,2})$/.exec(time.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 text-[10px] uppercase tracking-widest text-muted-foreground">{children}</div>;
}

function Empty({ text }: { text: string }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{text}</p>;
}

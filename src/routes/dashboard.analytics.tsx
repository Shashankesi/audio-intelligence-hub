import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense, lazy, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AnimatedCounter } from "@/components/site/AnimatedCounter";
import { formatBytes, useRecordings } from "@/lib/workspace";
import { Activity, Clock, HardDrive, Percent, Timer, Waves } from "lucide-react";

const DistributionPie = lazy(() => import("@/components/site/ActivityCharts").then((m) => ({ default: m.DistributionPie })));
const HorizontalBars = lazy(() => import("@/components/site/ActivityCharts").then((m) => ({ default: m.HorizontalBars })));
const TrendLine = lazy(() => import("@/components/site/ActivityCharts").then((m) => ({ default: m.TrendLine })));
const RadialGauge = lazy(() => import("@/components/site/ActivityCharts").then((m) => ({ default: m.RadialGauge })));

export const Route = createFileRoute("/dashboard/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — AudioInsight AI" },
      { name: "description", content: "Usage, processing performance and topic intelligence across your meetings." },
      { property: "og:title", content: "Analytics — AudioInsight AI" },
      { property: "og:description", content: "Usage, processing performance and topic intelligence across your meetings." },
    ],
  }),
  component: AnalyticsPage,
});

const STORAGE_QUOTA_BYTES = 2 * 1024 * 1024 * 1024;

function AnalyticsPage() {
  const { data: rows = [] } = useRecordings();

  const { data: summaries = [] } = useQuery({
    queryKey: ["summaries-analytics"],
    queryFn: async () => {
      const client = supabase as unknown as { from: (t: string) => any };
      const r = await client.from("summaries").select("recording_id, topics, keywords, sentiment, action_items");
      if (r.error) throw r.error;
      return (r.data ?? []) as Array<{ topics: string[]; keywords: string[]; action_items: unknown[]; sentiment: { label?: string } | null }>;
    },
  });

  const { data: transcripts = [] } = useQuery({
    queryKey: ["transcripts-analytics"],
    queryFn: async () => {
      const client = supabase as unknown as { from: (t: string) => any };
      const r = await client.from("transcripts").select("recording_id, latency_ms, text");
      if (r.error) throw r.error;
      return (r.data ?? []) as Array<{ recording_id: string; latency_ms: number | null; text: string }>;
    },
  });

  const live = rows.filter((r) => !r.deleted_at);
  const totalBytes = live.reduce((s, r) => s + (r.size_bytes ?? 0), 0);
  const totalMinutes = live.reduce((s, r) => s + (r.duration_sec ?? 0), 0) / 60;
  const done = live.filter((r) => r.status === "done").length;
  const successRate = live.length ? Math.round((done / live.length) * 100) : 0;
  const words = transcripts.reduce((s, t) => s + (t.text?.trim().split(/\s+/).filter(Boolean).length ?? 0), 0);
  const avgLatency = transcripts.length
    ? Math.round(transcripts.reduce((s, t) => s + (t.latency_ms ?? 0), 0) / transcripts.length / 100) / 10
    : 0;
  const actionItems = summaries.reduce((s, x) => s + (x.action_items?.length ?? 0), 0);

  const statusData = useMemo(() => {
    const map = new Map<string, number>();
    live.forEach((r) => map.set(r.status, (map.get(r.status) ?? 0) + 1));
    return [...map].map(([name, value]) => ({ name, value }));
  }, [live]);

  const topicData = useMemo(() => {
    const map = new Map<string, number>();
    summaries.forEach((s) => [...(s.topics ?? []), ...(s.keywords ?? [])].forEach((t) => {
      const key = String(t).trim().toLowerCase();
      if (key) map.set(key, (map.get(key) ?? 0) + 1);
    }));
    return [...map].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }));
  }, [summaries]);

  const trend = useMemo(() => {
    const now = new Date();
    const buckets = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      buckets.set(d.toISOString().slice(0, 10), 0);
    }
    live.forEach((r) => {
      const k = new Date(r.created_at).toISOString().slice(0, 10);
      if (buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + (r.duration_sec ?? 0) / 60);
    });
    return [...buckets].map(([d, v]) => ({ d: d.slice(5), value: Math.round(v) }));
  }, [live]);

  const stats = [
    { label: "Minutes processed", value: Math.round(totalMinutes), icon: Clock, suffix: "min" },
    { label: "Words transcribed", value: words, icon: Waves, suffix: "" },
    { label: "Action items found", value: actionItems, icon: Activity, suffix: "" },
    { label: "Success rate", value: successRate, icon: Percent, suffix: "%" },
    { label: "Avg. transcribe time", value: avgLatency, icon: Timer, suffix: "s", float: true },
    { label: "Storage used", value: totalBytes / 1024 / 1024, icon: HardDrive, suffix: "MB", float: true },
  ];

  return (
    <PageShell title="Analytics" description="Understand how your workspace processes meetings over time.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="glass rounded-[28px] border-white/10">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
                <span>{s.label}</span><s.icon className="h-4 w-4" />
              </div>
              <div className="mt-3 text-2xl font-bold">
                <AnimatedCounter value={s.value} format={s.float ? (n) => n.toFixed(1) : undefined} /> <span className="text-sm text-muted-foreground">{s.suffix}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="glass rounded-[28px] border-white/10 lg:col-span-2">
          <CardContent className="p-5">
            <h2 className="mb-2 text-sm font-semibold">Minutes processed · last 30 days</h2>
            <div className="h-64">
              <Suspense fallback={<Skeleton className="h-full w-full rounded-2xl bg-white/5" />}><TrendLine data={trend} label="minutes" /></Suspense>
            </div>
          </CardContent>
        </Card>
        <Card className="glass rounded-[28px] border-white/10">
          <CardContent className="p-5">
            <h2 className="mb-2 text-sm font-semibold">Pipeline status</h2>
            <div className="h-64">
              <Suspense fallback={<Skeleton className="h-full w-full rounded-2xl bg-white/5" />}><DistributionPie data={statusData} /></Suspense>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="glass rounded-[28px] border-white/10 lg:col-span-2">
          <CardContent className="p-5">
            <h2 className="mb-2 text-sm font-semibold">Most discussed topics</h2>
            <div className="h-72">
              {topicData.length === 0 ? (
                <p className="grid h-full place-items-center text-xs text-muted-foreground">Generate a few summaries to unlock topic intelligence.</p>
              ) : (
                <Suspense fallback={<Skeleton className="h-full w-full rounded-2xl bg-white/5" />}><HorizontalBars data={topicData} /></Suspense>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="glass rounded-[28px] border-white/10">
          <CardContent className="relative p-5">
            <h2 className="mb-2 text-sm font-semibold">Storage</h2>
            <div className="relative h-52">
              <Suspense fallback={<Skeleton className="h-full w-full rounded-2xl bg-white/5" />}>
                <RadialGauge value={totalBytes} max={STORAGE_QUOTA_BYTES} />
              </Suspense>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <div>
                  <div className="text-2xl font-bold text-gradient">{Math.round((totalBytes / STORAGE_QUOTA_BYTES) * 100)}%</div>
                  <div className="text-[11px] text-muted-foreground">{formatBytes(totalBytes)} of 2 GB</div>
                </div>
              </div>
            </div>
            <p className="text-center text-[11px] text-muted-foreground">Archive old meetings to free space.</p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
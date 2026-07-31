import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AnimatedCounter } from "@/components/site/AnimatedCounter";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  RadarChart, PolarAngleAxis, PolarGrid, Radar, BarChart, Bar,
} from "recharts";

export const Route = createFileRoute("/dashboard/evaluation")({
  component: EvalPage,
  head: () => ({
    meta: [
      { title: "Evaluation — AudioInsight AI" },
      { name: "description", content: "Live quality and performance metrics computed from your own transcriptions and summaries." },
      { property: "og:title", content: "Evaluation — AudioInsight AI" },
      { property: "og:description", content: "Latency, throughput, coverage and compression metrics for your workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const tip = { background: "oklch(0.2 0.03 265)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8 };

function EvalPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["evaluation"],
    queryFn: async () => {
      const [recs, trs, sums] = await Promise.all([
        (supabase.from("recordings") as any).select("id, name, status, duration_sec, size_bytes, model, created_at").order("created_at"),
        (supabase.from("transcripts") as any).select("recording_id, text, latency_ms, model, created_at"),
        (supabase.from("summaries") as any).select("recording_id, short_text, detailed_text, key_points, action_items, topics"),
      ]);
      return {
        recs: (recs.data ?? []) as any[],
        trs: (trs.data ?? []) as any[],
        sums: (sums.data ?? []) as any[],
      };
    },
  });

  const recs = data?.recs ?? [];
  const trs = data?.trs ?? [];
  const sums = data?.sums ?? [];

  const words = (s?: string) => (s ? s.trim().split(/\s+/).filter(Boolean).length : 0);
  const totalWords = trs.reduce((a, t) => a + words(t.text), 0);
  const totalAudioMin = recs.reduce((a, r) => a + (r.duration_sec ?? 0), 0) / 60;
  const latencies = trs.map((t) => t.latency_ms ?? 0).filter(Boolean);
  const avgLatency = latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
  const rtf = totalAudioMin > 0 && avgLatency ? (avgLatency / 1000) / (totalAudioMin * 60 / Math.max(1, trs.length)) : 0;
  const failed = recs.filter((r) => r.status === "failed").length;
  const successRate = recs.length ? ((recs.length - failed) / recs.length) * 100 : 0;
  const compression = (() => {
    const pairs = sums.map((s) => {
      const t = trs.find((x) => x.recording_id === s.recording_id);
      return t ? words(s.detailed_text) / Math.max(1, words(t.text)) : null;
    }).filter(Boolean) as number[];
    return pairs.length ? (pairs.reduce((a, b) => a + b, 0) / pairs.length) * 100 : 0;
  })();
  const coverage = recs.length ? (sums.length / recs.length) * 100 : 0;
  const avgWpm = totalAudioMin > 0 ? totalWords / totalAudioMin : 0;

  const cards = [
    { label: "Transcribed words", value: totalWords, suffix: "", desc: "Across all recordings" },
    { label: "Avg latency", value: Math.round(avgLatency / 1000), suffix: "s", desc: "Per transcription job" },
    { label: "Real-time factor", value: Number(rtf.toFixed(2)), suffix: "×", desc: "Processing / audio time" },
    { label: "Success rate", value: Math.round(successRate), suffix: "%", desc: `${failed} failed job(s)` },
    { label: "Summary coverage", value: Math.round(coverage), suffix: "%", desc: "Recordings with insights" },
  ];

  const trend = trs
    .slice()
    .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
    .map((t, i) => ({ run: "#" + (i + 1), latency: Math.round((t.latency_ms ?? 0) / 1000), words: words(t.text) }));

  const radar = [
    { m: "Coverage", v: Math.round(coverage) },
    { m: "Success", v: Math.round(successRate) },
    { m: "Density", v: Math.min(100, Math.round(avgWpm / 2)) },
    { m: "Compression", v: Math.min(100, Math.round(100 - compression)) },
    { m: "Speed", v: Math.max(0, Math.min(100, Math.round(100 - rtf * 100))) },
  ];

  const byModel = Object.values(
    trs.reduce((acc: Record<string, { model: string; jobs: number; latency: number }>, t) => {
      const k = (t.model || "unknown").split("/").pop()!;
      acc[k] ??= { model: k, jobs: 0, latency: 0 };
      acc[k].jobs += 1;
      acc[k].latency += (t.latency_ms ?? 0) / 1000;
      return acc;
    }, {}),
  ).map((m) => ({ ...m, latency: Math.round(m.latency / Math.max(1, m.jobs)) }));

  const empty = !isLoading && recs.length === 0;

  return (
    <PageShell
      title="Evaluation"
      description="Quality and performance metrics computed live from your own workspace runs."
      actions={<Badge className="bg-gradient-brand text-white">{recs.length} runs analysed</Badge>}
    >
      {empty ? (
        <Card className="glass border-white/10"><CardContent className="p-10 text-center text-sm text-muted-foreground">
          Upload a recording to start collecting evaluation data.
        </CardContent></Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {cards.map((m) => (
              <Card key={m.label} className="glass border-white/10">
                <CardContent className="p-4">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{m.label}</div>
                  <div className="mt-1 text-2xl font-bold text-gradient">
                    <AnimatedCounter value={m.value} />{m.suffix}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{m.desc}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card className="glass border-white/10"><CardContent className="p-5">
              <h3 className="mb-2 text-sm font-semibold">Latency per run (seconds)</h3>
              <div className="h-64"><ResponsiveContainer>
                <LineChart data={trend}>
                  <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
                  <XAxis dataKey="run" stroke="oklch(1 0 0 / 0.4)" fontSize={11} />
                  <YAxis stroke="oklch(1 0 0 / 0.4)" fontSize={11} />
                  <Tooltip contentStyle={tip} />
                  <Line type="monotone" dataKey="latency" stroke="oklch(0.72 0.19 295)" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer></div>
            </CardContent></Card>

            <Card className="glass border-white/10"><CardContent className="p-5">
              <h3 className="mb-2 text-sm font-semibold">Workspace profile</h3>
              <div className="h-64"><ResponsiveContainer>
                <RadarChart data={radar}>
                  <PolarGrid stroke="oklch(1 0 0 / 0.1)" />
                  <PolarAngleAxis dataKey="m" stroke="oklch(1 0 0 / 0.5)" fontSize={11} />
                  <Tooltip contentStyle={tip} />
                  <Radar dataKey="v" stroke="oklch(0.78 0.16 175)" fill="oklch(0.78 0.16 175)" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer></div>
            </CardContent></Card>

            <Card className="glass border-white/10"><CardContent className="p-5">
              <h3 className="mb-2 text-sm font-semibold">Avg latency by model (s)</h3>
              <div className="h-56"><ResponsiveContainer>
                <BarChart data={byModel}>
                  <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
                  <XAxis dataKey="model" stroke="oklch(1 0 0 / 0.4)" fontSize={11} />
                  <YAxis stroke="oklch(1 0 0 / 0.4)" fontSize={11} />
                  <Tooltip contentStyle={tip} />
                  <Bar dataKey="latency" fill="oklch(0.72 0.19 295)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer></div>
            </CardContent></Card>

            <Card className="glass border-white/10"><CardContent className="p-5">
              <h3 className="mb-3 text-sm font-semibold">Derived research metrics</h3>
              <div className="space-y-3 text-sm">
                {[
                  ["Speech density", `${avgWpm.toFixed(0)} words / min`],
                  ["Summary compression", `${compression.toFixed(1)}% of transcript length`],
                  ["Audio processed", `${totalAudioMin.toFixed(1)} min`],
                  ["Action items extracted", `${sums.reduce((a, s) => a + ((s.action_items ?? []).length), 0)}`],
                  ["Unique topics detected", `${new Set(sums.flatMap((s) => s.topics ?? [])).size}`],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </CardContent></Card>
          </div>
        </>
      )}
    </PageShell>
  );
}

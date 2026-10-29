import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AnimatedCounter } from "@/components/site/AnimatedCounter";
import { useEvaluationRuns } from "@/lib/evaluation";
import { pct } from "@/lib/metrics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Info, FlaskConical, FileSearch, GraduationCap, Loader2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/performance")({
  component: PerformancePage,
  head: () => ({
    meta: [
      { title: "Summarization Performance — AudioInsight AI" },
      { name: "description", content: "Research paper results for summarization quality and NLP evaluation metrics." },
      { property: "og:title", content: "Summarization Performance — AudioInsight AI" },
      { property: "og:description", content: "ROUGE scores, action item detection, diarization and topic accuracy from the research corpus." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

/* ------------------------- reported research results ------------------------- */

const ROUGE_RESULTS = [
  { metric: "ROUGE-1", value: 41.8, what: "Unigram (single-word) overlap between generated and reference summaries — how much of the reference wording the brief captures." },
  { metric: "ROUGE-2", value: 17.6, what: "Bigram (two-word phrase) overlap — measures word order and phrase-level fidelity, a stricter test than ROUGE-1." },
  { metric: "ROUGE-L", value: 38.9, what: "Longest common subsequence — sentence-level structural similarity that rewards fluent, well-ordered summaries." },
];

const NLP_RESULTS = [
  { metric: "Overall meeting-brief quality", raw: "90.4%", pctValue: 90.4, what: "Human-judged completeness and usability of the assembled brief (decisions, actions, deadlines, owners)." },
  { metric: "Topic classification accuracy", raw: "92.1%", pctValue: 92.1, what: "Share of meeting topics labelled with the correct semantic category." },
  { metric: "Action item detection (F1)", raw: "0.910", pctValue: 91.0, f1: true, what: "Harmonic mean of precision and recall when detecting action items and commitments." },
  { metric: "Speaker diarization (F1)", raw: "0.886", pctValue: 88.6, f1: true, what: "Correctness of speaker segmentation and attribution — who said what, and when." },
  { metric: "Key point extraction accuracy", raw: "89.5%", pctValue: 89.5, what: "Share of reference key points successfully recovered in the generated brief." },
];

const tipStyle = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12, color: "var(--popover-foreground)" };
const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];
const NLP_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-4)", "var(--chart-5)", "var(--chart-3)"];

function PerformancePage() {
  const { data: runs, isLoading } = useEvaluationRuns();
  const { data: corpus } = useQuery({
    queryKey: ["performance-corpus-size"],
    queryFn: async () => {
      const r = await (supabase.from("evaluation_references") as any).select("recording_id", { count: "exact", head: true });
      return r.count ?? 0;
    },
  });

  // Genuine aggregates computed only from stored evaluation runs.
  const runsList = runs ?? [];
  const agg = (() => {
    if (!runsList.length) return null;
    const mean = (k: string) => {
      const vals = runsList.map((r) => (r.metrics as any)?.[k]).filter((v: unknown) => typeof v === "number") as number[];
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };
    return {
      count: runsList.length,
      items: runsList.reduce((a, r) => a + ((r.metrics as any)?.items ?? 0), 0),
      transcriptsScored: runsList.reduce((a, r) => a + ((r.metrics as any)?.transcriptsScored ?? 0), 0),
      summariesScored: runsList.reduce((a, r) => a + ((r.metrics as any)?.summariesScored ?? 0), 0),
      wer: mean("wer"),
      cer: mean("cer"),
      rouge1: mean("rouge1"),
      rouge2: mean("rouge2"),
      rougeL: mean("rougeL"),
      avgLatencyMs: mean("avgLatencyMs"),
    };
  })();

  return (
    <PageShell
      title="Summarization Performance"
      description="Reported research results and genuine evaluation data from your own workspace."
      actions={
        <Badge variant="outline" className="gap-1.5">
          <GraduationCap className="h-3.5 w-3.5" /> Research results
        </Badge>
      }
    >
      {/* Origin of the numbers — explicit, non-negotiable framing */}
      <Card className="glass border-border/70">
        <CardContent className="flex items-start gap-3 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <p className="text-sm leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Research Paper Results</span> below are reported findings from an
            evaluation corpus of approximately <span className="font-medium text-foreground">12,000 meeting transcripts</span>.
            They are <span className="font-medium text-foreground">not live measurements</span> from this application. Genuine
            results produced inside your workspace appear separately under “Application Evaluation Results”.
          </p>
        </CardContent>
      </Card>

      {/* ------------------------------ paper results ----------------------------- */}
      <h2 className="mt-8 text-lg font-bold tracking-tight md:text-xl">Research Paper Results</h2>
      <p className="mt-1 text-sm text-muted-foreground">Summarization quality and NLP evaluation metrics reported in the research paper.</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ROUGE_RESULTS.map((r) => (
          <Card key={r.metric} className="glass border-border/70 transition-shadow hover:shadow-glow">
            <CardContent className="p-4">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{r.metric}</div>
              <div className="mt-1 text-3xl font-bold text-gradient">
                <AnimatedCounter value={r.value} format={fmt1} />%
              </div>
            </CardContent>
          </Card>
        ))}
        <Card className="glass border-border/70 sm:col-span-2 lg:col-span-4">
          <CardContent className="p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Overall meeting-brief quality</div>
            <div className="mt-1 text-3xl font-bold text-gradient">
              <AnimatedCounter value={90.4} format={fmt1} />%
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Human-judged completeness and usability of the assembled brief.</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Summarization metrics chart */}
        <Card className="glass border-border/70">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold">Summarization metrics (ROUGE)</h3>
            <p className="mt-1 text-xs text-muted-foreground">F1 overlap scores against human reference summaries.</p>
            <div className="mt-4 h-64">
              <ResponsiveContainer>
                <BarChart data={ROUGE_RESULTS} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                  <CartesianGrid stroke="oklch(0.35 0.03 258 / 0.1)" vertical={false} />
                  <XAxis dataKey="metric" fontSize={11} tickLine={false} axisLine={false} stroke="oklch(0.5 0.022 256)" />
                  <YAxis domain={[0, 60]} fontSize={11} tickLine={false} axisLine={false} stroke="oklch(0.5 0.022 256)" />
                  <Tooltip cursor={{ fill: "oklch(0.51 0.105 255 / 0.06)" }} contentStyle={tipStyle} formatter={(v: number) => [`${v}%`, "Score"]} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} animationDuration={800}>
                    {ROUGE_RESULTS.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              {ROUGE_RESULTS.map((r) => (
                <li key={r.metric}>
                  <span className="font-medium text-foreground">{r.metric}:</span> {r.what}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* NLP metrics chart */}
        <Card className="glass border-border/70">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold">NLP evaluation metrics</h3>
            <p className="mt-1 text-xs text-muted-foreground">Accuracy and F1 scores (F1 shown as a percentage equivalent).</p>
            <div className="mt-4 h-64">
              <ResponsiveContainer>
                <BarChart data={NLP_RESULTS} layout="vertical" margin={{ top: 4, right: 24, left: 40, bottom: 0 }}>
                  <CartesianGrid stroke="oklch(0.35 0.03 258 / 0.1)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} fontSize={11} tickLine={false} axisLine={false} stroke="oklch(0.5 0.022 256)" />
                  <YAxis type="category" dataKey="metric" width={150} fontSize={10} tickLine={false} axisLine={false} stroke="oklch(0.5 0.022 256)" />
                  <Tooltip cursor={{ fill: "oklch(0.51 0.105 255 / 0.06)" }} contentStyle={tipStyle} formatter={(v: number) => [`${v.toFixed(1)}%`, "Score"]} />
                  <Bar dataKey="pctValue" radius={[0, 8, 8, 0]} animationDuration={800}>
                    {NLP_RESULTS.map((_, i) => (
                      <Cell key={i} fill={NLP_COLORS[i % NLP_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              {NLP_RESULTS.map((r) => (
                <li key={r.metric}>
                  <span className="font-medium text-foreground">{r.metric} ({r.raw}):</span> {r.what}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* --------------------------- application results -------------------------- */}
      <h2 className="mt-10 text-lg font-bold tracking-tight md:text-xl">Application Evaluation Results</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Genuine averages computed from evaluation runs saved in your workspace. Nothing here is estimated.
      </p>

      {isLoading ? (
        <Card className="glass mt-4 border-border/70">
          <CardContent className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading evaluation runs…
          </CardContent>
        </Card>
      ) : !agg ? (
        <Card className="glass mt-4 border-border/70">
          <CardContent className="p-10 text-center">
            <FlaskConical className="mx-auto h-8 w-8 text-muted-foreground/60" aria-hidden />
            <h3 className="mt-3 text-sm font-semibold">No application evaluations available yet</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Run an evaluation from the Evaluation or Benchmarks pages to produce genuine WER and ROUGE results for your own
              recordings. They will appear here automatically.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button asChild size="sm" className="rounded-xl">
                <Link to="/dashboard/evaluation"><FileSearch className="mr-1.5 h-3.5 w-3.5" /> Open Evaluation</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="rounded-xl">
                <Link to="/dashboard/benchmarks"><FlaskConical className="mr-1.5 h-3.5 w-3.5" /> Open Benchmarks</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Evaluation runs", value: agg.count, suffix: "" },
              { label: "Items evaluated", value: agg.items, suffix: "" },
              { label: "Avg WER", value: agg.wer === null ? null : pct(agg.wer), suffix: "%" },
              { label: "Avg ROUGE-L", value: agg.rougeL === null ? null : pct(agg.rougeL), suffix: "%" },
            ].map((m) => (
              <Card key={m.label} className="glass border-border/70">
                <CardContent className="p-4">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{m.label}</div>
                  <div className="mt-1 text-2xl font-bold text-foreground">
                    {m.value === null ? <span className="text-muted-foreground">—</span> : <><AnimatedCounter value={m.value} />{m.suffix}</>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="glass mt-4 border-border/70">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold">Run history</h3>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Run</th>
                      <th className="pb-2 pr-4 font-medium">Date</th>
                      <th className="pb-2 pr-4 font-medium">Items</th>
                      <th className="pb-2 pr-4 font-medium">WER</th>
                      <th className="pb-2 pr-4 font-medium">ROUGE-1</th>
                      <th className="pb-2 pr-4 font-medium">ROUGE-2</th>
                      <th className="pb-2 font-medium">ROUGE-L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runsList.slice(0, 10).map((r) => (
                      <tr key={r.id} className="border-t border-border/60">
                        <td className="py-2 pr-4 font-medium text-foreground">{r.label}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                        <td className="py-2 pr-4">{(r.metrics as any)?.items ?? 0}</td>
                        <td className="py-2 pr-4">{(r.metrics as any)?.wer == null ? "—" : `${pct((r.metrics as any).wer)}%`}</td>
                        <td className="py-2 pr-4">{(r.metrics as any)?.rouge1 == null ? "—" : `${pct((r.metrics as any).rouge1)}%`}</td>
                        <td className="py-2 pr-4">{(r.metrics as any)?.rouge2 == null ? "—" : `${pct((r.metrics as any).rouge2)}%`}</td>
                        <td className="py-2">{(r.metrics as any)?.rougeL == null ? "—" : `${pct((r.metrics as any).rougeL)}%`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {agg.transcriptsScored} transcript(s) and {agg.summariesScored} summary(ies) scored against saved references across {agg.count} run(s).
                {corpus ? ` ${corpus} reference(s) saved.` : ""}
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </PageShell>
  );
}

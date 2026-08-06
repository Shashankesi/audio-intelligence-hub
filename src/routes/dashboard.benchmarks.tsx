import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, FileText, FlaskConical, Play, Save, Trash2 } from "lucide-react";
import { useRecordings } from "@/lib/workspace";
import {
  downloadFile,
  runEvaluation,
  runToCsv,
  runToMarkdown,
  useDeleteRun,
  useEvaluationReferences,
  useEvaluationRuns,
  useSaveReference,
  useSaveRun,
  type EvalItem,
  type EvalMetrics,
} from "@/lib/evaluation";
import { pct } from "@/lib/metrics";
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/dashboard/benchmarks")({
  component: BenchmarksPage,
  head: () => ({
    meta: [
      { title: "Benchmarks — AudioInsight AI" },
      { name: "description", content: "Measure transcription and summarisation quality with WER, CER and ROUGE against your own ground-truth references." },
      { property: "og:title", content: "Benchmarks — AudioInsight AI" },
      { property: "og:description", content: "Reproducible WER, CER, ROUGE and BERTScore benchmarks for the AudioInsight pipeline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const tip = { background: "oklch(0.2 0.03 265)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8 };
const BRAND = ["oklch(0.72 0.19 295)", "oklch(0.78 0.16 175)", "oklch(0.8 0.15 85)", "oklch(0.7 0.2 15)"];

type HarnessEntry = { slug: string; task: string; dataset: string; generated_at: string; systems: string[] };
type HarnessSystem = Record<string, string | number | null>;
type HarnessResult = { slug: string; task: string; dataset: string; generated_at: string; systems: HarnessSystem[] };

function BenchmarksPage() {
  return (
    <PageShell
      title="Benchmarks"
      description="Reproducible quality metrics for the AudioInsight pipeline. Every value shown is computed from real output — nothing is estimated."
      actions={<Badge className="bg-gradient-brand text-white"><FlaskConical className="mr-1 h-3 w-3" /> Research mode</Badge>}
    >
      <Tabs defaultValue="live">
        <TabsList className="glass mb-5 border border-white/10">
          <TabsTrigger value="live">Live evaluation</TabsTrigger>
          <TabsTrigger value="references">Ground truth</TabsTrigger>
          <TabsTrigger value="history">Run history</TabsTrigger>
          <TabsTrigger value="harness">Reference harness</TabsTrigger>
        </TabsList>
        <TabsContent value="live"><LiveEvaluation /></TabsContent>
        <TabsContent value="references"><References /></TabsContent>
        <TabsContent value="history"><History /></TabsContent>
        <TabsContent value="harness"><Harness /></TabsContent>
      </Tabs>
    </PageShell>
  );
}

/* ------------------------------- live runner ------------------------------- */

function LiveEvaluation() {
  const { data: refs = [] } = useEvaluationReferences();
  const { data: recordings = [] } = useRecordings();
  const saveRun = useSaveRun();
  const [progress, setProgress] = useState<{ done: number; total: number; label: string } | null>(null);
  const [result, setResult] = useState<{ metrics: EvalMetrics; items: EvalItem[]; duration_ms: number } | null>(null);
  const [scope, setScope] = useState("all");

  const scoped = scope === "all" ? undefined : [scope];
  const withRefs = recordings.filter((r) => refs.some((f) => f.recording_id === r.id));

  const run = async () => {
    if (!withRefs.length) {
      toast.error("Add at least one ground-truth reference first.");
      return;
    }
    setResult(null);
    setProgress({ done: 0, total: withRefs.length, label: "starting" });
    try {
      const out = await runEvaluation({
        recordingIds: scoped,
        onProgress: (done, total, label) => setProgress({ done, total, label }),
      });
      setResult(out);
      const label = scope === "all" ? "Workspace evaluation" : `Single-item: ${withRefs.find((r) => r.id === scope)?.name ?? scope}`;
      await saveRun.mutateAsync({ label, scope, metrics: out.metrics, items: out.items, duration_ms: out.duration_ms });
      toast.success(`Evaluated ${out.metrics.items} item(s) in ${(out.duration_ms / 1000).toFixed(2)}s`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Evaluation failed");
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="glass border-white/10">
        <CardContent className="flex flex-wrap items-end gap-3 p-5">
          <div className="min-w-56 flex-1">
            <label className="mb-1.5 block text-[11px] uppercase tracking-widest text-muted-foreground">Evaluation set</label>
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger className="glass border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All referenced recordings ({withRefs.length})</SelectItem>
                {withRefs.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={run} disabled={!!progress} className="bg-gradient-brand text-white">
            <Play className="mr-2 h-4 w-4" /> {progress ? "Running…" : "Run evaluation"}
          </Button>
          {result && (
            <>
              <Button variant="outline" className="border-white/15" onClick={() => downloadFile("evaluation.csv", runToCsv(result), "text/csv")}>
                <Download className="mr-2 h-4 w-4" /> CSV
              </Button>
              <Button
                variant="outline"
                className="border-white/15"
                onClick={() => downloadFile("evaluation.md", runToMarkdown({ label: "Live evaluation", ...result }), "text/markdown")}
              >
                <FileText className="mr-2 h-4 w-4" /> Markdown
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {progress && (
        <Card className="glass border-white/10"><CardContent className="p-5">
          <div className="mb-2 flex justify-between text-xs text-muted-foreground">
            <span>Scoring “{progress.label}”</span>
            <span>{progress.done}/{progress.total}</span>
          </div>
          <Progress value={progress.total ? (progress.done / progress.total) * 100 : 0} />
        </CardContent></Card>
      )}

      {!withRefs.length && !progress && (
        <Card className="glass border-white/10"><CardContent className="p-10 text-center text-sm text-muted-foreground">
          No ground truth yet. Open the <strong>Ground truth</strong> tab and paste a verified transcript or reference summary for at least one recording — metrics can only be computed against real references.
        </CardContent></Card>
      )}

      {result && <ResultView metrics={result.metrics} items={result.items} />}
    </div>
  );
}

function ResultView({ metrics, items }: { metrics: EvalMetrics; items: EvalItem[] }) {
  const cards = [
    { label: "WER", value: metrics.wer, invert: true, suffix: "%", n: metrics.transcriptsScored },
    { label: "CER", value: metrics.cer, invert: true, suffix: "%", n: metrics.transcriptsScored },
    { label: "ROUGE-1", value: metrics.rouge1, suffix: "%", n: metrics.summariesScored },
    { label: "ROUGE-2", value: metrics.rouge2, suffix: "%", n: metrics.summariesScored },
    { label: "ROUGE-L", value: metrics.rougeL, suffix: "%", n: metrics.summariesScored },
  ];
  const chart = items.map((i) => ({
    name: i.name.length > 14 ? i.name.slice(0, 14) + "…" : i.name,
    WER: i.wer === null ? null : pct(i.wer),
    "ROUGE-L": i.rougeL === null ? null : pct(i.rougeL),
  }));

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <Card key={c.label} className="glass border-white/10"><CardContent className="p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{c.label}</div>
            <div className="mt-1 text-2xl font-bold text-gradient">
              {c.value === null ? "—" : `${pct(c.value)}${c.suffix}`}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">{c.value === null ? "no reference supplied" : `${c.n} item(s) scored`}</div>
          </CardContent></Card>
        ))}
      </div>

      <Card className="glass border-white/10"><CardContent className="p-5">
        <h3 className="mb-3 text-sm font-semibold">Per-item quality (%)</h3>
        <div className="h-64"><ResponsiveContainer>
          <BarChart data={chart}>
            <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
            <XAxis dataKey="name" stroke="oklch(1 0 0 / 0.4)" fontSize={11} />
            <YAxis stroke="oklch(1 0 0 / 0.4)" fontSize={11} />
            <Tooltip contentStyle={tip} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="WER" fill={BRAND[3]} radius={[6, 6, 0, 0]} />
            <Bar dataKey="ROUGE-L" fill={BRAND[1]} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer></div>
      </CardContent></Card>

      <Card className="glass border-white/10"><CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead>Recording</TableHead><TableHead>Model</TableHead>
                <TableHead className="text-right">WER</TableHead><TableHead className="text-right">CER</TableHead>
                <TableHead className="text-right">R-1</TableHead><TableHead className="text-right">R-2</TableHead>
                <TableHead className="text-right">R-L</TableHead><TableHead className="text-right">Latency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((i) => (
                <TableRow key={i.recording_id} className="border-white/5">
                  <TableCell className="max-w-56 truncate">{i.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{i.model?.split("/").pop() ?? "—"}</TableCell>
                  <TableCell className="text-right">{i.wer === null ? "—" : `${pct(i.wer)}%`}</TableCell>
                  <TableCell className="text-right">{i.cer === null ? "—" : `${pct(i.cer)}%`}</TableCell>
                  <TableCell className="text-right">{i.rouge1 === null ? "—" : `${pct(i.rouge1)}%`}</TableCell>
                  <TableCell className="text-right">{i.rouge2 === null ? "—" : `${pct(i.rouge2)}%`}</TableCell>
                  <TableCell className="text-right">{i.rougeL === null ? "—" : `${pct(i.rougeL)}%`}</TableCell>
                  <TableCell className="text-right">{i.latency_ms === null ? "—" : `${(i.latency_ms / 1000).toFixed(2)}s`}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent></Card>
    </div>
  );
}

/* ------------------------------ ground truth ------------------------------- */

function References() {
  const { data: recordings = [] } = useRecordings();
  const { data: refs = [] } = useEvaluationReferences();
  const save = useSaveReference();
  const [selected, setSelected] = useState<string>("");
  const current = recordings.find((r) => r.id === selected) ?? recordings[0];
  const existing = refs.find((r) => r.recording_id === current?.id);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  const transcriptValue = transcript ?? existing?.reference_transcript ?? "";
  const summaryValue = summary ?? existing?.reference_summary ?? "";

  if (!recordings.length) {
    return <Card className="glass border-white/10"><CardContent className="p-10 text-center text-sm text-muted-foreground">Upload and process a recording first.</CardContent></Card>;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
      <Card className="glass border-white/10"><CardContent className="max-h-[70vh] space-y-1 overflow-auto p-3">
        {recordings.map((r) => {
          const has = refs.some((f) => f.recording_id === r.id);
          const active = current?.id === r.id;
          return (
            <button
              key={r.id}
              onClick={() => { setSelected(r.id); setTranscript(null); setSummary(null); }}
              className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs transition ${active ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"}`}
            >
              <span className="truncate">{r.name}</span>
              {has && <Badge variant="outline" className="border-emerald-400/40 text-[9px] text-emerald-300">ref</Badge>}
            </button>
          );
        })}
      </CardContent></Card>

      <Card className="glass border-white/10"><CardContent className="space-y-4 p-5">
        <div>
          <h3 className="text-sm font-semibold">{current?.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Paste a human-verified transcript to measure WER/CER, and a reference summary to measure ROUGE. Leave a field blank to skip that metric for this item.
          </p>
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] uppercase tracking-widest text-muted-foreground">Ground-truth transcript</label>
          <Textarea rows={10} value={transcriptValue} onChange={(e) => setTranscript(e.target.value)} className="glass border-white/10 font-mono text-xs" placeholder="Verified transcript…" />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] uppercase tracking-widest text-muted-foreground">Reference summary</label>
          <Textarea rows={6} value={summaryValue} onChange={(e) => setSummary(e.target.value)} className="glass border-white/10 text-xs" placeholder="Human-written summary…" />
        </div>
        <Button
          className="bg-gradient-brand text-white"
          disabled={!current || save.isPending}
          onClick={() =>
            current &&
            save.mutate({ recording_id: current.id, reference_transcript: transcriptValue, reference_summary: summaryValue })
          }
        >
          <Save className="mr-2 h-4 w-4" /> Save reference
        </Button>
      </CardContent></Card>
    </div>
  );
}

/* -------------------------------- run history ------------------------------- */

function History() {
  const { data: runs = [], isLoading } = useEvaluationRuns();
  const del = useDeleteRun();

  if (isLoading) return <Card className="glass border-white/10"><CardContent className="p-10 text-center text-sm text-muted-foreground">Loading…</CardContent></Card>;
  if (!runs.length) return <Card className="glass border-white/10"><CardContent className="p-10 text-center text-sm text-muted-foreground">No evaluation runs saved yet.</CardContent></Card>;

  const trend = runs
    .slice()
    .reverse()
    .map((r, i) => ({
      run: `#${i + 1}`,
      WER: r.metrics.wer === null ? null : pct(r.metrics.wer),
      "ROUGE-L": r.metrics.rougeL === null ? null : pct(r.metrics.rougeL),
    }));

  return (
    <div className="space-y-5">
      <Card className="glass border-white/10"><CardContent className="p-5">
        <h3 className="mb-3 text-sm font-semibold">Quality over time (%)</h3>
        <div className="h-56"><ResponsiveContainer>
          <BarChart data={trend}>
            <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
            <XAxis dataKey="run" stroke="oklch(1 0 0 / 0.4)" fontSize={11} />
            <YAxis stroke="oklch(1 0 0 / 0.4)" fontSize={11} />
            <Tooltip contentStyle={tip} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="WER" fill={BRAND[3]} radius={[6, 6, 0, 0]} />
            <Bar dataKey="ROUGE-L" fill={BRAND[1]} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer></div>
      </CardContent></Card>

      <div className="space-y-3">
        {runs.map((r) => (
          <Card key={r.id} className="glass border-white/10"><CardContent className="flex flex-wrap items-center gap-4 p-4">
            <div className="min-w-48 flex-1">
              <div className="text-sm font-medium">{r.label}</div>
              <div className="text-[11px] text-muted-foreground">
                {new Date(r.created_at).toLocaleString()} · {r.metrics.items} item(s) · {((r.duration_ms ?? 0) / 1000).toFixed(2)}s
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {(["wer", "rouge1", "rouge2", "rougeL"] as const).map((k) => (
                <span key={k} className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1">
                  {k.toUpperCase()}: {r.metrics[k] === null ? "—" : `${pct(r.metrics[k] as number)}%`}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="border-white/15" onClick={() => downloadFile(`${r.label}.csv`, runToCsv(r), "text/csv")}>
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="outline" className="border-white/15" onClick={() => downloadFile(`${r.label}.md`, runToMarkdown(r), "text/markdown")}>
                <FileText className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => del.mutate(r.id)} aria-label="Delete run">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- reference harness ---------------------------- */

function Harness() {
  const { data: index = [], isLoading } = useQuery({
    queryKey: ["harness-index"],
    queryFn: async (): Promise<HarnessEntry[]> => {
      const res = await fetch("/results/index.json");
      if (!res.ok) return [];
      return (await res.json()) as HarnessEntry[];
    },
  });
  const [slug, setSlug] = useState<string>("");
  const active = slug || index[0]?.slug || "";

  const { data: result } = useQuery({
    queryKey: ["harness-result", active],
    enabled: !!active,
    queryFn: async (): Promise<HarnessResult | null> => {
      const res = await fetch(`/results/${active}.json`);
      if (!res.ok) return null;
      return (await res.json()) as HarnessResult;
    },
  });

  const metricKeys = useMemo(() => {
    if (!result) return [];
    const candidates = ["wer", "cer", "rouge1", "rouge2", "rougeL", "bertscore_f1", "avg_latency_s", "cpu_time_s", "peak_memory_mb", "real_time_factor"];
    return candidates.filter((k) => result.systems.some((s) => typeof s[k] === "number"));
  }, [result]);

  if (isLoading) return <Card className="glass border-white/10"><CardContent className="p-10 text-center text-sm text-muted-foreground">Loading…</CardContent></Card>;

  if (!index.length) {
    return (
      <Card className="glass border-white/10"><CardContent className="space-y-3 p-8 text-sm">
        <h3 className="text-base font-semibold">No harness results published yet</h3>
        <p className="text-muted-foreground">
          Paper-grade metrics (WER on AMI, ROUGE + BERTScore on SAMSum/QMSum, Whisper base vs small, CPU time and peak memory) are produced by the Python
          harness in <code className="rounded bg-white/10 px-1">scripts/eval</code>. Those libraries cannot run inside this serverless app, so you run them
          locally and commit the output — this page then renders only what actually exists.
        </p>
        <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 text-[11px] leading-relaxed">
{`pip install -r scripts/eval/requirements.txt
python scripts/eval/download_datasets.py --dataset samsum --limit 50
python scripts/eval/run_eval.py --task summarization --dataset samsum --limit 50
python scripts/eval/download_datasets.py --dataset ami --limit 20
python scripts/eval/run_eval.py --task asr --dataset ami --models base,small --limit 20`}
        </pre>
        <p className="text-muted-foreground">
          Results land in <code className="rounded bg-white/10 px-1">results/</code> (JSON, CSV, Markdown, charts) and
          <code className="ml-1 rounded bg-white/10 px-1">public/results/</code>, which this dashboard reads.
        </p>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="glass border-white/10"><CardContent className="flex flex-wrap items-end gap-3 p-5">
        <div className="min-w-64 flex-1">
          <label className="mb-1.5 block text-[11px] uppercase tracking-widest text-muted-foreground">Benchmark run</label>
          <Select value={active} onValueChange={setSlug}>
            <SelectTrigger className="glass border-white/10"><SelectValue /></SelectTrigger>
            <SelectContent>
              {index.map((e) => (
                <SelectItem key={e.slug} value={e.slug}>
                  {e.task} · {e.dataset} · {new Date(e.generated_at).toLocaleDateString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {result && (
          <Button
            variant="outline"
            className="border-white/15"
            onClick={() => {
              const keys = Object.keys(result.systems[0] ?? {});
              const csv = [keys.join(","), ...result.systems.map((s) => keys.map((k) => `"${String(s[k] ?? "")}"`).join(","))].join("\n");
              downloadFile(`${result.slug}.csv`, csv, "text/csv");
            }}
          >
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        )}
      </CardContent></Card>

      {result && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {metricKeys.slice(0, 4).map((key) => (
              <Card key={key} className="glass border-white/10"><CardContent className="p-5">
                <h3 className="mb-3 text-sm font-semibold">{key}</h3>
                <div className="h-56"><ResponsiveContainer>
                  <BarChart data={result.systems.map((s) => ({ system: String(s.system), value: Number(s[key] ?? 0) }))}>
                    <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
                    <XAxis dataKey="system" stroke="oklch(1 0 0 / 0.4)" fontSize={11} />
                    <YAxis stroke="oklch(1 0 0 / 0.4)" fontSize={11} />
                    <Tooltip contentStyle={tip} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {result.systems.map((_, i) => <Cell key={i} fill={BRAND[i % BRAND.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer></div>
              </CardContent></Card>
            ))}
          </div>

          <Card className="glass border-white/10"><CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead>System</TableHead>
                  {metricKeys.map((k) => <TableHead key={k} className="text-right">{k}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.systems.map((s) => (
                  <TableRow key={String(s.system)} className="border-white/5">
                    <TableCell>{String(s.system)}</TableCell>
                    {metricKeys.map((k) => <TableCell key={k} className="text-right">{s[k] === null || s[k] === undefined ? "—" : String(s[k])}</TableCell>)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
          <p className="text-[11px] text-muted-foreground">
            Generated {new Date(result.generated_at).toLocaleString()} by <code>scripts/eval/run_eval.py</code> · dataset <strong>{result.dataset}</strong>.
          </p>
        </>
      )}
    </div>
  );
}
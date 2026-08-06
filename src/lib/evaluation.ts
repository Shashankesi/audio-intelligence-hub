import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { characterErrorRate, pct, scoreSummary, wordErrorRate, type TextScores } from "@/lib/metrics";

const db = supabase as unknown as { from: (t: string) => any };

export type EvaluationReference = {
  recording_id: string;
  reference_transcript: string;
  reference_summary: string;
  updated_at: string;
};

export type EvalItem = {
  recording_id: string;
  name: string;
  model: string | null;
  duration_sec: number | null;
  latency_ms: number | null;
  wer: number | null;
  cer: number | null;
  substitutions: number | null;
  deletions: number | null;
  insertions: number | null;
  rouge1: number | null;
  rouge2: number | null;
  rougeL: number | null;
  compute_ms: number;
};

export type EvalMetrics = {
  items: number;
  transcriptsScored: number;
  summariesScored: number;
  wer: number | null;
  cer: number | null;
  rouge1: number | null;
  rouge2: number | null;
  rougeL: number | null;
  avgLatencyMs: number | null;
  realTimeFactor: number | null;
  models: string[];
};

export type EvaluationRun = {
  id: string;
  label: string;
  scope: string;
  metrics: EvalMetrics;
  items: EvalItem[];
  duration_ms: number | null;
  created_at: string;
};

export function useEvaluationReferences() {
  return useQuery({
    queryKey: ["evaluation-references"],
    queryFn: async () => {
      const r = await db.from("evaluation_references").select("*");
      if (r.error) throw r.error;
      return (r.data ?? []) as EvaluationReference[];
    },
  });
}

export function useSaveReference() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { recording_id: string; reference_transcript: string; reference_summary: string }) => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("You must be signed in.");
      const r = await db
        .from("evaluation_references")
        .upsert({ ...input, user_id: uid }, { onConflict: "recording_id" });
      if (r.error) throw r.error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["evaluation-references"] });
      toast.success("Reference saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useEvaluationRuns() {
  return useQuery({
    queryKey: ["evaluation-runs"],
    queryFn: async () => {
      const r = await db.from("evaluation_runs").select("*").order("created_at", { ascending: false }).limit(50);
      if (r.error) throw r.error;
      return (r.data ?? []) as EvaluationRun[];
    },
  });
}

export function useDeleteRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const r = await db.from("evaluation_runs").delete().eq("id", id);
      if (r.error) throw r.error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["evaluation-runs"] }),
  });
}

type PipelineRow = {
  id: string;
  name: string;
  model: string | null;
  duration_sec: number | null;
  transcript: string | null;
  transcript_model: string | null;
  latency_ms: number | null;
  summary: string | null;
};

/** Loads every recording that has a stored reference, joined with its transcript + summary. */
export async function loadEvaluationCorpus(recordingIds?: string[]): Promise<{ rows: PipelineRow[]; refs: Map<string, EvaluationReference> }> {
  const [refsRes, recRes, trRes, sumRes] = await Promise.all([
    db.from("evaluation_references").select("*"),
    db.from("recordings").select("id, name, model, duration_sec"),
    db.from("transcripts").select("recording_id, text, model, latency_ms"),
    db.from("summaries").select("recording_id, detailed_text, short_text"),
  ]);
  const refs = new Map<string, EvaluationReference>();
  for (const r of (refsRes.data ?? []) as EvaluationReference[]) refs.set(r.recording_id, r);
  const transcripts = new Map<string, any>();
  for (const t of trRes.data ?? []) transcripts.set(t.recording_id, t);
  const summaries = new Map<string, any>();
  for (const s of sumRes.data ?? []) summaries.set(s.recording_id, s);

  const rows: PipelineRow[] = ((recRes.data ?? []) as any[])
    .filter((r) => refs.has(r.id) && (!recordingIds || recordingIds.includes(r.id)))
    .map((r) => {
      const t = transcripts.get(r.id);
      const s = summaries.get(r.id);
      return {
        id: r.id,
        name: r.name,
        model: r.model,
        duration_sec: r.duration_sec,
        transcript: t?.text ?? null,
        transcript_model: t?.model ?? r.model ?? null,
        latency_ms: t?.latency_ms ?? null,
        summary: (s?.detailed_text || s?.short_text) ?? null,
      };
    });
  return { rows, refs };
}

const mean = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null);

/**
 * Runs the evaluation entirely in the browser over real stored pipeline output.
 * Nothing is estimated: an item is only scored when a ground-truth reference exists.
 */
export async function runEvaluation(opts: {
  recordingIds?: string[];
  onProgress?: (done: number, total: number, label: string) => void;
}): Promise<{ metrics: EvalMetrics; items: EvalItem[]; duration_ms: number }> {
  const startedAt = performance.now();
  const { rows, refs } = await loadEvaluationCorpus(opts.recordingIds);
  const items: EvalItem[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    opts.onProgress?.(i, rows.length, row.name);
    // yield to the event loop so the progress UI can paint between items
    await new Promise((r) => setTimeout(r, 0));
    const ref = refs.get(row.id)!;
    const t0 = performance.now();

    let wer: EvalItem["wer"] = null;
    let cer: EvalItem["cer"] = null;
    let sub: number | null = null;
    let del: number | null = null;
    let ins: number | null = null;
    if (ref.reference_transcript.trim() && row.transcript?.trim()) {
      const w = wordErrorRate(ref.reference_transcript, row.transcript);
      wer = w.rate;
      sub = w.substitutions;
      del = w.deletions;
      ins = w.insertions;
      cer = characterErrorRate(ref.reference_transcript, row.transcript);
    }

    let scores: TextScores | null = null;
    if (ref.reference_summary.trim() && row.summary?.trim()) {
      scores = scoreSummary(ref.reference_summary, row.summary);
    }

    items.push({
      recording_id: row.id,
      name: row.name,
      model: row.transcript_model,
      duration_sec: row.duration_sec,
      latency_ms: row.latency_ms,
      wer,
      cer,
      substitutions: sub,
      deletions: del,
      insertions: ins,
      rouge1: scores ? scores.rouge1.f1 : null,
      rouge2: scores ? scores.rouge2.f1 : null,
      rougeL: scores ? scores.rougeL.f1 : null,
      compute_ms: Math.round(performance.now() - t0),
    });
  }
  opts.onProgress?.(rows.length, rows.length, "done");

  const num = (k: keyof EvalItem) => items.map((i) => i[k]).filter((v): v is number => typeof v === "number");
  const latencies = num("latency_ms");
  const audioSeconds = items.reduce((a, i) => a + (i.duration_sec ?? 0), 0);
  const processedSeconds = latencies.reduce((a, b) => a + b, 0) / 1000;

  const metrics: EvalMetrics = {
    items: items.length,
    transcriptsScored: num("wer").length,
    summariesScored: num("rougeL").length,
    wer: mean(num("wer")),
    cer: mean(num("cer")),
    rouge1: mean(num("rouge1")),
    rouge2: mean(num("rouge2")),
    rougeL: mean(num("rougeL")),
    avgLatencyMs: mean(latencies),
    realTimeFactor: audioSeconds > 0 && processedSeconds > 0 ? processedSeconds / audioSeconds : null,
    models: Array.from(new Set(items.map((i) => i.model).filter(Boolean) as string[])),
  };

  return { metrics, items, duration_ms: Math.round(performance.now() - startedAt) };
}

export function useSaveRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (run: { label: string; scope: string; metrics: EvalMetrics; items: EvalItem[]; duration_ms: number }) => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("You must be signed in.");
      const r = await db.from("evaluation_runs").insert({ ...run, user_id: uid });
      if (r.error) throw r.error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["evaluation-runs"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ---------------------------------- exports --------------------------------- */

const fmt = (v: number | null, digits = 2) => (v === null ? "" : v.toFixed(digits));

export function runToCsv(run: { metrics: EvalMetrics; items: EvalItem[] }): string {
  const head = [
    "recording_id", "name", "model", "duration_sec", "latency_ms",
    "wer", "cer", "substitutions", "deletions", "insertions",
    "rouge1_f1", "rouge2_f1", "rougeL_f1",
  ];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = run.items.map((i) =>
    [
      i.recording_id, i.name, i.model ?? "", i.duration_sec ?? "", i.latency_ms ?? "",
      fmt(i.wer, 4), fmt(i.cer, 4), i.substitutions ?? "", i.deletions ?? "", i.insertions ?? "",
      fmt(i.rouge1, 4), fmt(i.rouge2, 4), fmt(i.rougeL, 4),
    ].map(esc).join(","),
  );
  return [head.join(","), ...lines].join("\n");
}

export function runToMarkdown(run: { label: string; created_at?: string; metrics: EvalMetrics; items: EvalItem[]; duration_ms: number | null }): string {
  const m = run.metrics;
  const row = (k: string, v: string) => `| ${k} | ${v} |`;
  return [
    `# AudioInsight AI — Evaluation report`,
    ``,
    `**Run:** ${run.label}`,
    `**Generated:** ${run.created_at ?? new Date().toISOString()}`,
    `**Items evaluated:** ${m.items} (${m.transcriptsScored} with reference transcript, ${m.summariesScored} with reference summary)`,
    `**Models observed:** ${m.models.join(", ") || "n/a"}`,
    ``,
    `## Aggregate metrics`,
    ``,
    `| Metric | Value |`,
    `| --- | --- |`,
    row("WER", m.wer === null ? "not measured" : `${pct(m.wer)}%`),
    row("CER", m.cer === null ? "not measured" : `${pct(m.cer)}%`),
    row("ROUGE-1 F1", m.rouge1 === null ? "not measured" : `${pct(m.rouge1)}%`),
    row("ROUGE-2 F1", m.rouge2 === null ? "not measured" : `${pct(m.rouge2)}%`),
    row("ROUGE-L F1", m.rougeL === null ? "not measured" : `${pct(m.rougeL)}%`),
    row("Average latency", m.avgLatencyMs === null ? "not measured" : `${(m.avgLatencyMs / 1000).toFixed(2)} s`),
    row("Real-time factor", m.realTimeFactor === null ? "not measured" : `${m.realTimeFactor.toFixed(3)}×`),
    ``,
    `## Per-item results`,
    ``,
    `| Recording | Model | WER | ROUGE-1 | ROUGE-2 | ROUGE-L | Latency (s) |`,
    `| --- | --- | --- | --- | --- | --- | --- |`,
    ...run.items.map(
      (i) =>
        `| ${i.name} | ${i.model ?? "—"} | ${i.wer === null ? "—" : `${pct(i.wer)}%`} | ${i.rouge1 === null ? "—" : `${pct(i.rouge1)}%`} | ${i.rouge2 === null ? "—" : `${pct(i.rouge2)}%`} | ${i.rougeL === null ? "—" : `${pct(i.rougeL)}%`} | ${i.latency_ms === null ? "—" : (i.latency_ms / 1000).toFixed(2)} |`,
    ),
    ``,
    `> Metrics are computed with the same definitions as the Python reference harness in \`scripts/eval\` (word-level Levenshtein WER, clipped n-gram ROUGE, LCS-based ROUGE-L). Empty cells mean no ground-truth reference was supplied for that item — nothing is estimated.`,
    ``,
  ].join("\n");
}

export function downloadFile(filename: string, contents: string, mime: string) {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
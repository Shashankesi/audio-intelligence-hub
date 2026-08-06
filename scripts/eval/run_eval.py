"""Reference evaluation harness for AudioInsight AI.

Pipeline:  audio -> faster-whisper -> transcript -> LLM summary -> metrics

Metrics
  ASR            : WER / CER (jiwer)
  Summarisation  : ROUGE-1 / ROUGE-2 / ROUGE-L (rouge-score), BERTScore F1
  Systems        : wall-clock latency, CPU time, peak RSS memory, real-time factor

Every number written to ``results/`` is produced by an actual run of this
script. The dashboard refuses to display anything that is not present here.

Examples
    python scripts/eval/run_eval.py --task asr --dataset ami --models base,small --limit 20
    python scripts/eval/run_eval.py --task summarization --dataset samsum --limit 50
"""

from __future__ import annotations

import argparse
import json
import os
import resource
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data"
RESULTS_DIR = ROOT / "results"
PUBLIC_RESULTS_DIR = ROOT / "public" / "results"

GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions"
SUMMARY_PROMPT = (
    "Summarise the following conversation in 2-4 sentences. "
    "Only output the summary text.\n\n{source}"
)


def peak_rss_mb() -> float:
    usage = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    # Linux reports kilobytes, macOS reports bytes
    return usage / 1024 if os.uname().sysname == "Linux" else usage / (1024 * 1024)


def read_jsonl(path: Path, limit: int) -> list[dict]:
    rows: list[dict] = []
    with path.open(encoding="utf-8") as fh:
        for line in fh:
            if len(rows) >= limit:
                break
            rows.append(json.loads(line))
    return rows


def run_asr(dataset: str, models: list[str], limit: int) -> dict:
    from faster_whisper import WhisperModel
    import jiwer

    rows = read_jsonl(DATA_DIR / f"{dataset}.jsonl", limit)
    if not rows:
        raise SystemExit(f"no data for {dataset}; run download_datasets.py first")

    systems = []
    for model_name in models:
        model = WhisperModel(model_name, device="cpu", compute_type="int8")
        items, audio_seconds = [], 0.0
        cpu_start = time.process_time()
        for row in rows:
            audio_path = ROOT / row["audio"]
            t0 = time.perf_counter()
            segments, info = model.transcribe(str(audio_path), beam_size=5)
            hypothesis = " ".join(s.text.strip() for s in segments).strip()
            latency = time.perf_counter() - t0
            audio_seconds += float(info.duration or 0)
            items.append(
                {
                    "id": row["id"],
                    "reference": row["reference"],
                    "hypothesis": hypothesis,
                    "latency_s": round(latency, 4),
                    "audio_s": round(float(info.duration or 0), 3),
                    "wer": round(jiwer.wer(row["reference"], hypothesis or " "), 6),
                    "cer": round(jiwer.cer(row["reference"], hypothesis or " "), 6),
                }
            )
        cpu_time = time.process_time() - cpu_start
        total_latency = sum(i["latency_s"] for i in items)
        systems.append(
            {
                "system": f"faster-whisper-{model_name}",
                "items": len(items),
                "wer": round(sum(i["wer"] for i in items) / len(items), 6),
                "cer": round(sum(i["cer"] for i in items) / len(items), 6),
                "avg_latency_s": round(total_latency / len(items), 4),
                "cpu_time_s": round(cpu_time, 3),
                "peak_memory_mb": round(peak_rss_mb(), 1),
                "real_time_factor": round(total_latency / audio_seconds, 4) if audio_seconds else None,
                "detail": items,
            }
        )
    return {"task": "asr", "dataset": dataset, "systems": systems}


def summarize(source: str, model: str, api_key: str) -> str:
    import requests

    response = requests.post(
        GATEWAY_URL,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "model": model,
            "messages": [{"role": "user", "content": SUMMARY_PROMPT.format(source=source[:12000])}],
        },
        timeout=180,
    )
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"].strip()


def run_summarization(dataset: str, models: list[str], limit: int, skip_bertscore: bool) -> dict:
    from rouge_score import rouge_scorer

    api_key = os.environ.get("LOVABLE_API_KEY")
    if not api_key:
        raise SystemExit("LOVABLE_API_KEY is required for summarisation evaluation")

    rows = read_jsonl(DATA_DIR / f"{dataset}.jsonl", limit)
    if not rows:
        raise SystemExit(f"no data for {dataset}; run download_datasets.py first")

    scorer = rouge_scorer.RougeScorer(["rouge1", "rouge2", "rougeL"], use_stemmer=True)
    systems = []
    for model in models:
        items = []
        cpu_start = time.process_time()
        for row in rows:
            t0 = time.perf_counter()
            hypothesis = summarize(row["source"], model, api_key)
            latency = time.perf_counter() - t0
            scores = scorer.score(row["reference"], hypothesis)
            items.append(
                {
                    "id": row["id"],
                    "reference": row["reference"],
                    "hypothesis": hypothesis,
                    "latency_s": round(latency, 4),
                    "rouge1": round(scores["rouge1"].fmeasure, 6),
                    "rouge2": round(scores["rouge2"].fmeasure, 6),
                    "rougeL": round(scores["rougeL"].fmeasure, 6),
                }
            )
        cpu_time = time.process_time() - cpu_start

        bertscore_f1 = None
        if not skip_bertscore:
            from bert_score import score as bert_score

            _, _, f1 = bert_score(
                [i["hypothesis"] for i in items],
                [i["reference"] for i in items],
                lang="en",
                rescale_with_baseline=True,
            )
            for item, value in zip(items, f1.tolist()):
                item["bertscore_f1"] = round(value, 6)
            bertscore_f1 = round(float(f1.mean()), 6)

        mean = lambda key: round(sum(i[key] for i in items) / len(items), 6)  # noqa: E731
        systems.append(
            {
                "system": model,
                "items": len(items),
                "rouge1": mean("rouge1"),
                "rouge2": mean("rouge2"),
                "rougeL": mean("rougeL"),
                "bertscore_f1": bertscore_f1,
                "avg_latency_s": mean("latency_s"),
                "cpu_time_s": round(cpu_time, 3),
                "peak_memory_mb": round(peak_rss_mb(), 1),
                "detail": items,
            }
        )
    return {"task": "summarization", "dataset": dataset, "systems": systems}


def write_outputs(result: dict) -> None:
    import pandas as pd

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    slug = f"{result['task']}-{result['dataset']}-{stamp}"
    result["generated_at"] = datetime.now(timezone.utc).isoformat()
    result["slug"] = slug

    (RESULTS_DIR / f"{slug}.json").write_text(json.dumps(result, indent=2), encoding="utf-8")

    summary_rows = [{k: v for k, v in s.items() if k != "detail"} for s in result["systems"]]
    frame = pd.DataFrame(summary_rows)
    frame.to_csv(RESULTS_DIR / f"{slug}.csv", index=False)

    markdown = [
        f"# {result['task'].upper()} evaluation — {result['dataset']}",
        "",
        f"Generated: {result['generated_at']}",
        "",
        frame.to_markdown(index=False),
        "",
        "All values were produced by `scripts/eval/run_eval.py`.",
        "",
    ]
    (RESULTS_DIR / f"{slug}.md").write_text("\n".join(markdown), encoding="utf-8")

    write_charts(result, slug)

    # the app reads only the compact (detail-free) payloads from public/results
    compact = {**result, "systems": summary_rows}
    (PUBLIC_RESULTS_DIR / f"{slug}.json").write_text(json.dumps(compact, indent=2), encoding="utf-8")

    index_path = PUBLIC_RESULTS_DIR / "index.json"
    index = json.loads(index_path.read_text(encoding="utf-8")) if index_path.exists() else []
    index = [entry for entry in index if entry["slug"] != slug]
    index.append(
        {
            "slug": slug,
            "task": result["task"],
            "dataset": result["dataset"],
            "generated_at": result["generated_at"],
            "systems": [s["system"] for s in summary_rows],
        }
    )
    index.sort(key=lambda e: e["generated_at"], reverse=True)
    index_path.write_text(json.dumps(index, indent=2), encoding="utf-8")
    print(f"wrote results/{slug}.(json|csv|md) and public/results/{slug}.json")


def write_charts(result: dict, slug: str) -> None:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    keys = ["wer", "cer"] if result["task"] == "asr" else ["rouge1", "rouge2", "rougeL", "bertscore_f1"]
    keys = [k for k in keys if any(s.get(k) is not None for s in result["systems"])]
    if not keys:
        return
    labels = [s["system"] for s in result["systems"]]
    fig, axes = plt.subplots(1, len(keys), figsize=(4 * len(keys), 3.5), squeeze=False)
    for ax, key in zip(axes[0], keys):
        ax.bar(labels, [s.get(key) or 0 for s in result["systems"]], color="#8b5cf6")
        ax.set_title(key)
        ax.tick_params(axis="x", rotation=20)
    fig.tight_layout()
    fig.savefig(RESULTS_DIR / f"{slug}-metrics.png", dpi=150)
    plt.close(fig)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--task", choices=["asr", "summarization"], required=True)
    parser.add_argument("--dataset", required=True, help="samsum | qmsum | ami")
    parser.add_argument("--models", default="", help="comma separated; whisper sizes for asr, gateway model ids for summarization")
    parser.add_argument("--limit", type=int, default=25)
    parser.add_argument("--skip-bertscore", action="store_true")
    args = parser.parse_args()

    default_models = "base,small" if args.task == "asr" else "google/gemini-2.5-flash"
    models = [m.strip() for m in (args.models or default_models).split(",") if m.strip()]

    if args.task == "asr":
        result = run_asr(args.dataset, models, args.limit)
    else:
        result = run_summarization(args.dataset, models, args.limit, args.skip_bertscore)
    write_outputs(result)


if __name__ == "__main__":
    main()
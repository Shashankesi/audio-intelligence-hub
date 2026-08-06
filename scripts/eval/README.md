# AudioInsight AI — evaluation harness

Paper-grade metrics for the transcription and summarisation pipeline. Everything
in `results/` is produced by these scripts; the in-app benchmark dashboard only
renders files that actually exist. Nothing is estimated or hard-coded.

## Setup

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r scripts/eval/requirements.txt
export LOVABLE_API_KEY=...      # required for the summarisation task only
```

`faster-whisper` downloads the CTranslate2 Whisper weights on first use and
`bert-score` downloads a RoBERTa checkpoint (~1.4 GB). Both need network access
the first time; afterwards runs are offline.

## 1. Download data

```bash
python scripts/eval/download_datasets.py --dataset samsum --limit 100   # summarisation
python scripts/eval/download_datasets.py --dataset qmsum  --limit 30    # long meetings
python scripts/eval/download_datasets.py --dataset ami    --limit 20    # meeting speech (WER)
```

Data is cached as JSONL under `data/` (git-ignored).

## 2. Run evaluations

```bash
# ASR: Whisper base vs small, WER/CER + latency/CPU/memory
python scripts/eval/run_eval.py --task asr --dataset ami --models base,small --limit 20

# Summarisation: ROUGE-1/2/L + BERTScore against human reference summaries
python scripts/eval/run_eval.py --task summarization --dataset samsum --limit 50

# Skip the heavy BERTScore download
python scripts/eval/run_eval.py --task summarization --dataset samsum --limit 50 --skip-bertscore
```

## 3. Outputs

| Path | Contents |
| --- | --- |
| `results/<slug>.json` | full run incl. every hypothesis/reference pair |
| `results/<slug>.csv` | per-system aggregate table |
| `results/<slug>.md` | Markdown report for the paper |
| `results/<slug>-metrics.png` | comparison bar charts |
| `public/results/<slug>.json` | detail-free copy read by the dashboard |
| `public/results/index.json` | manifest the dashboard lists |

Commit `public/results/` to publish a benchmark to the dashboard
(Dashboard → Benchmarks → Reference harness).

## Metric definitions

| Metric | Implementation |
| --- | --- |
| WER / CER | `jiwer` word/character Levenshtein error rate |
| ROUGE-1/2/L | `rouge-score` with Porter stemming, F-measure |
| BERTScore | `bert-score`, English, baseline-rescaled F1 |
| Latency | wall-clock seconds per item |
| CPU time | `time.process_time()` across the run |
| Peak memory | `resource.getrusage` max RSS |
| Real-time factor | processing seconds ÷ audio seconds |

The in-app runner (`src/lib/metrics.ts`) mirrors the WER and ROUGE definitions
in TypeScript so live workspace runs are comparable with these numbers.
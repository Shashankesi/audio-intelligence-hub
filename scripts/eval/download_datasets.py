"""Download the evaluation datasets used by AudioInsight AI.

Usage:
    python scripts/eval/download_datasets.py --dataset samsum --limit 100
    python scripts/eval/download_datasets.py --dataset ami --limit 20

Datasets are cached under ``data/`` as JSONL so the evaluation run is
reproducible offline. Nothing is generated or synthesised here.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parents[2] / "data"

DATASETS = {
    # dialogue summarisation, reference summaries written by humans
    "samsum": {"hf_id": "Samsung/samsum", "split": "test", "kind": "summarization"},
    # long meeting summarisation
    "qmsum": {"hf_id": "pszemraj/qmsum-cleaned", "split": "validation", "kind": "summarization"},
    # meeting speech, used for WER
    "ami": {"hf_id": "edinburghcstr/ami", "config": "ihm", "split": "test", "kind": "asr"},
}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", choices=sorted(DATASETS), required=True)
    parser.add_argument("--limit", type=int, default=50)
    args = parser.parse_args()

    from datasets import load_dataset  # imported lazily so --help works without deps

    spec = DATASETS[args.dataset]
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    kwargs = {"split": spec["split"]}
    if "config" in spec:
        kwargs["name"] = spec["config"]
    ds = load_dataset(spec["hf_id"], **kwargs)

    out_path = DATA_DIR / f"{args.dataset}.jsonl"
    audio_dir = DATA_DIR / f"{args.dataset}_audio"
    if spec["kind"] == "asr":
        audio_dir.mkdir(parents=True, exist_ok=True)

    written = 0
    with out_path.open("w", encoding="utf-8") as fh:
        for i, row in enumerate(ds):
            if written >= args.limit:
                break
            if spec["kind"] == "summarization":
                source = row.get("dialogue") or row.get("input") or row.get("transcript") or ""
                target = row.get("summary") or row.get("output") or ""
                if not source or not target:
                    continue
                record = {"id": str(row.get("id", i)), "source": source, "reference": target}
            else:
                import soundfile as sf

                audio = row["audio"]
                wav_path = audio_dir / f"{args.dataset}_{i:05d}.wav"
                sf.write(wav_path, audio["array"], audio["sampling_rate"])
                record = {
                    "id": str(row.get("segment_id", i)),
                    "audio": os.path.relpath(wav_path, DATA_DIR.parent),
                    "reference": row.get("text", ""),
                }
                if not record["reference"]:
                    continue
            fh.write(json.dumps(record, ensure_ascii=False) + "\n")
            written += 1

    print(f"wrote {written} rows -> {out_path}")


if __name__ == "__main__":
    main()
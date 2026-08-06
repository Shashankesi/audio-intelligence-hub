/**
 * Pure-TypeScript implementations of the text metrics used by the in-app
 * evaluation runner. These are the same definitions used by the Python
 * reference harness (`scripts/eval`), so numbers are directly comparable:
 *  - WER / CER: Levenshtein edit distance over words / characters.
 *  - ROUGE-1 / ROUGE-2: n-gram overlap F1 with clipped counts.
 *  - ROUGE-L: F1 over the longest common subsequence.
 * No value here is ever synthesised — every metric is computed from the two
 * strings passed in.
 */

export type PRF = { precision: number; recall: number; f1: number };
export type EditStats = { rate: number; substitutions: number; deletions: number; insertions: number; refLength: number };

export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[^\p{L}\p{N}'\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(input: string): string[] {
  const n = normalizeText(input);
  return n ? n.split(" ") : [];
}

/** Levenshtein alignment with operation counts (Wagner–Fischer, O(n*m)). */
function editOps(ref: string[], hyp: string[]): { s: number; d: number; i: number } {
  const n = ref.length;
  const m = hyp.length;
  // cost matrix + backtrace stored as flat arrays
  const cost = new Int32Array((n + 1) * (m + 1));
  const op = new Uint8Array((n + 1) * (m + 1)); // 0 match,1 sub,2 del,3 ins
  const idx = (a: number, b: number) => a * (m + 1) + b;
  for (let i = 1; i <= n; i++) {
    cost[idx(i, 0)] = i;
    op[idx(i, 0)] = 2;
  }
  for (let j = 1; j <= m; j++) {
    cost[idx(0, j)] = j;
    op[idx(0, j)] = 3;
  }
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const match = ref[i - 1] === hyp[j - 1];
      const sub = cost[idx(i - 1, j - 1)] + (match ? 0 : 1);
      const del = cost[idx(i - 1, j)] + 1;
      const ins = cost[idx(i, j - 1)] + 1;
      let best = sub;
      let o = match ? 0 : 1;
      if (del < best) {
        best = del;
        o = 2;
      }
      if (ins < best) {
        best = ins;
        o = 3;
      }
      cost[idx(i, j)] = best;
      op[idx(i, j)] = o;
    }
  }
  let i = n;
  let j = m;
  let s = 0;
  let d = 0;
  let ins = 0;
  while (i > 0 || j > 0) {
    const o = op[idx(i, j)];
    if (i > 0 && j > 0 && (o === 0 || o === 1)) {
      if (o === 1) s++;
      i--;
      j--;
    } else if (i > 0 && o === 2) {
      d++;
      i--;
    } else {
      ins++;
      j--;
    }
  }
  return { s, d, i: ins };
}

export function wordErrorRate(reference: string, hypothesis: string): EditStats {
  const ref = tokenize(reference);
  const hyp = tokenize(hypothesis);
  if (ref.length === 0) return { rate: hyp.length ? 1 : 0, substitutions: 0, deletions: 0, insertions: hyp.length, refLength: 0 };
  const { s, d, i } = editOps(ref, hyp);
  return { rate: (s + d + i) / ref.length, substitutions: s, deletions: d, insertions: i, refLength: ref.length };
}

export function characterErrorRate(reference: string, hypothesis: string): number {
  const ref = normalizeText(reference).split("");
  const hyp = normalizeText(hypothesis).split("");
  if (!ref.length) return hyp.length ? 1 : 0;
  const { s, d, i } = editOps(ref, hyp);
  return (s + d + i) / ref.length;
}

function ngrams(tokens: string[], n: number): Map<string, number> {
  const out = new Map<string, number>();
  for (let i = 0; i + n <= tokens.length; i++) {
    const k = tokens.slice(i, i + n).join(" ");
    out.set(k, (out.get(k) ?? 0) + 1);
  }
  return out;
}

function prf(overlap: number, hypTotal: number, refTotal: number): PRF {
  const precision = hypTotal ? overlap / hypTotal : 0;
  const recall = refTotal ? overlap / refTotal : 0;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  return { precision, recall, f1 };
}

export function rougeN(reference: string, hypothesis: string, n: number): PRF {
  const ref = ngrams(tokenize(reference), n);
  const hyp = ngrams(tokenize(hypothesis), n);
  let overlap = 0;
  let hypTotal = 0;
  let refTotal = 0;
  hyp.forEach((c) => (hypTotal += c));
  ref.forEach((c) => (refTotal += c));
  hyp.forEach((count, gram) => {
    const r = ref.get(gram);
    if (r) overlap += Math.min(count, r);
  });
  return prf(overlap, hypTotal, refTotal);
}

/** Longest common subsequence length (rolling rows, O(n*m) time / O(m) space). */
function lcsLength(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  let prev = new Int32Array(b.length + 1);
  let cur = new Int32Array(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
    }
    const t = prev;
    prev = cur;
    cur = t;
    cur.fill(0);
  }
  return prev[b.length];
}

export function rougeL(reference: string, hypothesis: string): PRF {
  const ref = tokenize(reference);
  const hyp = tokenize(hypothesis);
  return prf(lcsLength(ref, hyp), hyp.length, ref.length);
}

export type TextScores = {
  rouge1: PRF;
  rouge2: PRF;
  rougeL: PRF;
};

export function scoreSummary(reference: string, hypothesis: string): TextScores {
  return {
    rouge1: rougeN(reference, hypothesis, 1),
    rouge2: rougeN(reference, hypothesis, 2),
    rougeL: rougeL(reference, hypothesis),
  };
}

export const pct = (v: number) => Number((v * 100).toFixed(2));
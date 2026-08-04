import { supabase } from "@/integrations/supabase/client";

export type AudioPart = { url: string; offset: number };

/** Chunk length used by the uploader when splitting long meetings. */
export const PART_SEC = 480;

/**
 * Resolve a recording's storage path to one or more signed, playable URLs.
 * Single-object recordings return one part; long meetings return their ordered
 * chunks with the cumulative time offset each one starts at.
 */
export async function resolveAudioParts(storagePath: string): Promise<AudioPart[]> {
  const isSingle = /\.[a-z0-9]{2,5}$/i.test(storagePath);
  const paths = isSingle
    ? [storagePath]
    : ((
        await supabase.storage.from("recordings").list(storagePath, {
          limit: 200,
          sortBy: { column: "name", order: "asc" },
        })
      ).data ?? [])
        .filter((o) => o.name && !o.name.startsWith("."))
        .map((o) => `${storagePath}/${o.name}`)
        .sort();

  if (!paths.length) return [];
  const signed = await supabase.storage.from("recordings").createSignedUrls(paths, 60 * 60);
  if (signed.error) throw signed.error;
  return (signed.data ?? [])
    .filter((s) => s.signedUrl)
    .map((s, i) => ({ url: s.signedUrl as string, offset: paths.length > 1 ? i * PART_SEC : 0 }));
}

/** Downsample an audio file into `count` normalized peaks for waveform drawing. */
export async function loadPeaks(url: string, count = 220): Promise<number[]> {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const AC: typeof AudioContext =
    (window.AudioContext as typeof AudioContext) ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC();
  try {
    const decoded = await ctx.decodeAudioData(buf);
    const data = decoded.getChannelData(0);
    const block = Math.floor(data.length / count) || 1;
    const peaks: number[] = [];
    for (let i = 0; i < count; i++) {
      let max = 0;
      for (let j = i * block; j < (i + 1) * block && j < data.length; j += 8) {
        const v = Math.abs(data[j]);
        if (v > max) max = v;
      }
      peaks.push(max);
    }
    const top = Math.max(...peaks, 0.001);
    return peaks.map((p) => Math.min(1, p / top));
  } finally {
    void ctx.close();
  }
}

export const formatClock = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

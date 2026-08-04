import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { formatClock } from "@/lib/audio-source";

export type Segment = { start: number; end: number; text: string; speaker?: string | null };

function highlight(text: string, q: string) {
  if (!q.trim()) return text;
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return parts.map((p, i) =>
    p.toLowerCase() === q.toLowerCase() ? (
      <mark key={i} className="rounded bg-fuchsia-400/30 px-0.5 text-foreground">
        {p}
      </mark>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

/** Timestamped transcript that follows playback and supports search + jumping. */
export function TranscriptView({
  segments,
  plainText,
  query,
  currentTime,
  onSeek,
  autoScroll = true,
}: {
  segments: Segment[];
  plainText: string;
  query: string;
  currentTime: number;
  onSeek?: (t: number) => void;
  autoScroll?: boolean;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const [userScrolled, setUserScrolled] = useState(false);

  const activeIndex = useMemo(() => {
    if (!segments.length) return -1;
    for (let i = segments.length - 1; i >= 0; i--) if (currentTime >= segments[i].start) return i;
    return 0;
  }, [segments, currentTime]);

  useEffect(() => {
    if (!autoScroll || userScrolled || activeIndex < 0) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-seg="${activeIndex}"]`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeIndex, autoScroll, userScrolled]);

  const filtered = useMemo(
    () => (query.trim() ? segments.filter((s) => s.text.toLowerCase().includes(query.toLowerCase())) : segments),
    [segments, query],
  );

  if (!segments.length) {
    return (
      <div className="max-h-[62vh] overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm leading-7">
        {highlight(plainText, query)}
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      onWheel={() => setUserScrolled(true)}
      onMouseLeave={() => setUserScrolled(false)}
      className="max-h-[62vh] space-y-1.5 overflow-auto pr-1"
    >
      {filtered.map((s) => {
        const i = segments.indexOf(s);
        const active = i === activeIndex && !query.trim();
        return (
          <div
            key={i}
            data-seg={i}
            className={cn(
              "group flex gap-3 rounded-xl border border-transparent px-3 py-2 transition-colors",
              active ? "border-white/15 bg-white/[0.07]" : "hover:bg-white/[0.04]",
            )}
          >
            <button
              type="button"
              onClick={() => onSeek?.(s.start)}
              aria-label={`Jump to ${formatClock(s.start)}`}
              className={cn(
                "h-fit shrink-0 rounded-md px-2 py-0.5 font-mono text-[11px] tabular-nums transition",
                active ? "bg-gradient-brand text-white" : "bg-white/8 text-muted-foreground hover:bg-white/15 hover:text-foreground",
              )}
            >
              {formatClock(s.start)}
            </button>
            <p className={cn("text-sm leading-relaxed", active ? "text-foreground" : "text-foreground/80")}>
              {s.speaker && <span className="mr-1.5 font-semibold text-gradient">{s.speaker}:</span>}
              {highlight(s.text, query)}
            </p>
          </div>
        );
      })}
      {query.trim() && filtered.length === 0 && (
        <p className="p-6 text-center text-sm text-muted-foreground">No matches for “{query}”.</p>
      )}
    </div>
  );
}

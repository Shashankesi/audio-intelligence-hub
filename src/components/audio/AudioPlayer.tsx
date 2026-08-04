import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, Loader2, AudioLines } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { formatClock, loadPeaks, resolveAudioParts, type AudioPart } from "@/lib/audio-source";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export function AudioPlayer({
  storagePath,
  totalDuration = 0,
  onTime,
  className,
  registerSeek,
}: {
  storagePath?: string | null;
  totalDuration?: number;
  onTime?: (t: number) => void;
  className?: string;
  registerSeek?: (fn: (t: number) => void) => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [parts, setParts] = useState<AudioPart[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [partDur, setPartDur] = useState(0);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pendingSeek = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!storagePath) return;
    setLoading(true);
    resolveAudioParts(storagePath)
      .then((p) => {
        if (cancelled) return;
        if (!p.length) setError("Audio file is no longer available.");
        setParts(p);
      })
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [storagePath]);

  // Real waveform peaks for the active part.
  useEffect(() => {
    let cancelled = false;
    const url = parts[index]?.url;
    if (!url) return;
    setPeaks([]);
    loadPeaks(url)
      .then((p) => !cancelled && setPeaks(p))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [parts, index]);

  const offset = parts[index]?.offset ?? 0;
  const duration = totalDuration || (parts.length > 1 ? parts[parts.length - 1].offset + partDur : partDur);
  const globalTime = offset + time;

  useEffect(() => onTime?.(globalTime), [globalTime, onTime]);

  const seek = useCallback(
    (target: number) => {
      const t = Math.max(0, Math.min(target, duration || target));
      const i = parts.reduce((acc, p, k) => (t >= p.offset ? k : acc), 0);
      if (i !== index) {
        pendingSeek.current = t - (parts[i]?.offset ?? 0);
        setIndex(i);
      } else if (audioRef.current) {
        audioRef.current.currentTime = t - offset;
        setTime(t - offset);
      }
    },
    [duration, index, offset, parts],
  );

  useEffect(() => registerSeek?.(seek), [registerSeek, seek]);

  useEffect(() => {
    const el = audioRef.current;
    if (el) {
      el.playbackRate = speed;
      el.volume = volume;
    }
  }, [speed, volume, index]);

  const onEnded = () => {
    if (index < parts.length - 1) {
      pendingSeek.current = 0;
      setIndex(index + 1);
      setPlaying(true);
    } else setPlaying(false);
  };

  const onLoaded = () => {
    const el = audioRef.current;
    if (!el) return;
    setPartDur(el.duration || 0);
    if (pendingSeek.current != null) {
      el.currentTime = pendingSeek.current;
      pendingSeek.current = null;
    }
    if (playing) void el.play();
  };

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  };

  const progress = duration ? globalTime / duration : 0;
  const bars = peaks.length ? peaks : Array.from({ length: 120 }, (_, i) => 0.25 + 0.2 * Math.sin(i / 4));

  return (
    <div className={cn("rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl", className)}>
      {parts[index] && (
        <audio
          ref={audioRef}
          src={parts[index].url}
          preload="metadata"
          onLoadedMetadata={onLoaded}
          onTimeUpdate={(e) => setTime((e.target as HTMLAudioElement).currentTime)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={onEnded}
          onError={() => setError("Playback failed for this file.")}
        />
      )}

      <div className="flex items-center gap-3">
        <Button
          size="icon"
          aria-label={playing ? "Pause" : "Play"}
          onClick={toggle}
          disabled={!parts.length}
          className="h-11 w-11 shrink-0 rounded-full bg-gradient-brand text-white shadow-glow transition-transform hover:scale-105"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
        </Button>
        <Button variant="ghost" size="icon" aria-label="Back 10 seconds" onClick={() => seek(globalTime - 10)} disabled={!parts.length}>
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Forward 10 seconds" onClick={() => seek(globalTime + 10)} disabled={!parts.length}>
          <SkipForward className="h-4 w-4" />
        </Button>

        <div className="min-w-0 flex-1">
          <button
            type="button"
            aria-label="Seek"
            className="group flex h-14 w-full items-end gap-[2px] rounded-lg px-1"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              seek(((e.clientX - r.left) / r.width) * (duration || 0));
            }}
          >
            {bars.map((p, i) => {
              const played = i / bars.length <= progress;
              return (
                <span
                  key={i}
                  className={cn(
                    "flex-1 rounded-full transition-[height,background-color] duration-150",
                    played ? "bg-gradient-brand" : "bg-white/15 group-hover:bg-white/25",
                  )}
                  style={{ height: `${Math.max(8, p * 100)}%` }}
                />
              );
            })}
          </button>
          <div className="mt-1 flex items-center justify-between text-[11px] tabular-nums text-muted-foreground">
            <span>{formatClock(globalTime)}</span>
            {parts.length > 1 && (
              <span className="flex items-center gap-1">
                <AudioLines className="h-3 w-3" /> part {index + 1}/{parts.length}
              </span>
            )}
            <span>{duration ? formatClock(duration) : "--:--"}</span>
          </div>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <Slider
            aria-label="Volume"
            value={[volume * 100]}
            max={100}
            step={1}
            className="w-20"
            onValueChange={(v) => setVolume(v[0] / 100)}
          />
        </div>
        <button
          type="button"
          onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])}
          className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold tabular-nums transition hover:bg-white/10"
          aria-label="Playback speed"
        >
          {speed}×
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </div>
  );
}

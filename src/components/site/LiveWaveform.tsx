import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Animated equalizer / waveform. Deterministic heights keep SSR stable. */
export function LiveWaveform({
  bars = 56,
  className,
  height = 72,
  playing = true,
}: {
  bars?: number;
  className?: string;
  height?: number;
  playing?: boolean;
}) {
  return (
    <div className={cn("flex items-center justify-center gap-[3px]", className)} style={{ height }} aria-hidden>
      {Array.from({ length: bars }).map((_, i) => {
        const envelope = Math.sin((i / bars) * Math.PI); // taper at both ends
        const base = 0.18 + envelope * 0.75;
        return (
          <motion.span
            key={i}
            className="w-[3px] rounded-full bg-gradient-to-t from-primary/40 via-brand-2 to-brand-3"
            style={{ height: "100%", transformOrigin: "center" }}
            animate={
              playing
                ? { scaleY: [base * 0.25, base, base * 0.45, base * 0.9, base * 0.3] }
                : { scaleY: 0.12 }
            }
            transition={
              playing
                ? { duration: 1.3 + (i % 6) * 0.12, repeat: Infinity, ease: "easeInOut", delay: i * 0.02 }
                : { duration: 0.4 }
            }
          />
        );
      })}
    </div>
  );
}
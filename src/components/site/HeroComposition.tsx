import { lazy, Suspense, useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { ClientOnly } from "./ClientOnly";
import { LiveWaveform } from "./LiveWaveform";
import { FileText, Sparkles, Cpu, ListChecks, Waves } from "lucide-react";

const HeroScene = lazy(() => import("./HeroScene"));

function Fallback() {
  return (
    <div className="relative h-full w-full">
      <motion.div
        className="absolute inset-[12%] rounded-full blur-[2px]"
        style={{
          background:
            "radial-gradient(circle at 32% 28%, oklch(0.98 0.02 260 / 0.9), oklch(0.62 0.21 293) 42%, oklch(0.3 0.14 275) 72%, transparent 74%)",
          boxShadow: "0 40px 120px -30px oklch(0.55 0.25 295 / 0.8)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 46, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

/**
 * Layered hero centerpiece: background glow, 3D glass crystal core,
 * floating glass cards (audio chip, transcript, summary, processing) and a
 * live waveform — all reacting subtly to the pointer.
 */
export function HeroComposition() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 60, damping: 20 });
  const sy = useSpring(y, { stiffness: 60, damping: 20 });

  useEffect(() => {
    const on = (e: MouseEvent) => {
      x.set((e.clientX / window.innerWidth - 0.5) * 26);
      y.set((e.clientY / window.innerHeight - 0.5) * 26);
    };
    window.addEventListener("mousemove", on);
    return () => window.removeEventListener("mousemove", on);
  }, [x, y]);

  const [progress, setProgress] = useState(18);
  useEffect(() => {
    const t = setInterval(() => setProgress((p) => (p >= 98 ? 12 : p + 1)), 90);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      className="relative mx-auto aspect-square w-full max-w-[34rem]"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      style={{ x: sx, y: sy }}
    >
      {/* background glow */}
      <div
        className="pointer-events-none absolute inset-[8%] rounded-full opacity-70 blur-[90px] animate-pulse-glow"
        style={{ background: "conic-gradient(from 90deg, oklch(0.55 0.25 295/0.6), oklch(0.62 0.19 258/0.45), oklch(0.86 0.21 160/0.3), oklch(0.55 0.25 295/0.6))" }}
      />
      {/* concentric halo rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute rounded-full border border-white/[0.07]"
          style={{ inset: `${4 + i * 9}%` }}
          animate={{ rotate: i % 2 ? -360 : 360 }}
          transition={{ duration: 60 + i * 25, repeat: Infinity, ease: "linear" }}
        />
      ))}

      {/* 3D core */}
      <div className="absolute inset-0">
        <ClientOnly fallback={<Fallback />}>
          <Suspense fallback={<Fallback />}>
            <HeroScene />
          </Suspense>
        </ClientOnly>
      </div>

      {/* audio chip */}
      <FloatCard className="left-[-6%] top-[12%] w-[13.5rem]" delay={0}>
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand shadow-glow">
            <Waves className="h-4 w-4 text-white" />
          </span>
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold">product-sync.wav</div>
            <div className="text-[10px] text-muted-foreground">32:14 · 16 kHz mono</div>
          </div>
        </div>
        <LiveWaveform bars={26} height={26} className="mt-3" />
      </FloatCard>

      {/* transcript preview */}
      <FloatCard className="right-[-8%] top-[24%] w-[15rem]" delay={0.6}>
        <div className="flex items-center gap-2 text-[11px] font-semibold">
          <FileText className="h-3.5 w-3.5 text-brand-2" /> Transcript
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          <span className="text-foreground">Priya:</span> Latency dropped ~40% after the streaming rollout…
        </p>
        <div className="mt-2 h-1 w-2/3 rounded-full bg-white/10">
          <motion.div className="h-1 rounded-full bg-gradient-brand" animate={{ width: ["20%", "95%", "20%"] }} transition={{ duration: 5, repeat: Infinity }} />
        </div>
      </FloatCard>

      {/* summary preview */}
      <FloatCard className="bottom-[16%] left-[-2%] w-[15.5rem]" delay={1.1}>
        <div className="flex items-center gap-2 text-[11px] font-semibold">
          <Sparkles className="h-3.5 w-3.5 text-brand-4" /> Summary
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Ship streaming broadly. Hold pricing copy one more week. Roadmap review moves to Thursday.
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {["Streaming", "Pricing", "Q4"].map((t) => (
            <span key={t} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] text-muted-foreground">{t}</span>
          ))}
        </div>
      </FloatCard>

      {/* processing chip */}
      <FloatCard className="bottom-[6%] right-[0%] w-[12.5rem]" delay={1.6}>
        <div className="flex items-center justify-between text-[11px] font-semibold">
          <span className="flex items-center gap-2"><Cpu className="h-3.5 w-3.5 text-brand-3" /> Processing</span>
          <span className="tabular-nums text-muted-foreground">{progress}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <motion.div className="h-full rounded-full bg-gradient-brand" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <ListChecks className="h-3 w-3" /> 3 action items extracted
        </div>
      </FloatCard>
    </motion.div>
  );
}

function FloatCard({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute z-10 rounded-2xl glass-strong p-3.5 ${className ?? ""}`}
      initial={{ opacity: 0, y: 22, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.5 + delay }}
      whileHover={{ scale: 1.04, y: -4 }}
    >
      <motion.div animate={{ y: [0, -9, 0] }} transition={{ duration: 6 + delay, repeat: Infinity, ease: "easeInOut" }}>
        {children}
      </motion.div>
    </motion.div>
  );
}
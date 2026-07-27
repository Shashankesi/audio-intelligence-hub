import { motion } from "framer-motion";

export function Waveform({ bars = 48, className = "" }: { bars?: number; className?: string }) {
  return (
    <div className={"flex h-16 items-center gap-1 " + className} aria-hidden>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.span
          key={i}
          className="w-1 rounded-full bg-gradient-brand"
          initial={{ scaleY: 0.3 }}
          animate={{ scaleY: [0.25, 0.9, 0.4, 1, 0.35] }}
          transition={{ duration: 1.6 + (i % 5) * 0.1, repeat: Infinity, delay: i * 0.03 }}
          style={{ height: `${20 + ((i * 13) % 40)}px` }}
        />
      ))}
    </div>
  );
}

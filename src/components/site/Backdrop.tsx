import { motion } from "framer-motion";

export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(1_0_0/0.04)_1px,transparent_1px),linear-gradient(to_bottom,oklch(1_0_0/0.04)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <motion.div
        className="absolute -top-32 -left-20 h-[38rem] w-[38rem] rounded-full opacity-40 blur-3xl animate-blob"
        style={{ background: "radial-gradient(circle, oklch(0.72 0.19 295 / 0.6), transparent 60%)" }}
      />
      <motion.div
        className="absolute top-1/3 -right-40 h-[36rem] w-[36rem] rounded-full opacity-35 blur-3xl animate-blob"
        style={{ background: "radial-gradient(circle, oklch(0.75 0.17 220 / 0.55), transparent 60%)", animationDelay: "-4s" }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 h-[30rem] w-[30rem] rounded-full opacity-30 blur-3xl animate-blob"
        style={{ background: "radial-gradient(circle, oklch(0.78 0.16 175 / 0.55), transparent 60%)", animationDelay: "-8s" }}
      />
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute h-1 w-1 rounded-full bg-white/60 shadow-[0_0_12px_2px_oklch(0.72_0.19_295_/_0.7)]"
          style={{ left: `${(i * 53) % 100}%`, top: `${(i * 37) % 100}%` }}
          animate={{ y: [0, -30, 0], opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 6 + (i % 5), repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

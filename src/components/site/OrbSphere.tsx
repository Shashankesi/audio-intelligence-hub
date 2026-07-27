import { motion } from "framer-motion";

export function OrbSphere() {
  return (
    <div className="relative mx-auto h-72 w-72 md:h-96 md:w-96">
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle at 30% 30%, oklch(0.95 0.02 260), oklch(0.72 0.19 295) 40%, oklch(0.35 0.15 275) 70%, transparent 72%)",
          boxShadow: "0 30px 80px -20px oklch(0.72 0.19 295 / 0.7), inset -30px -40px 80px oklch(0.2 0.05 260 / 0.6)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-4 rounded-full opacity-70 mix-blend-screen"
        style={{
          background: "conic-gradient(from 90deg, oklch(0.75 0.17 220 / 0.6), transparent 40%, oklch(0.78 0.16 175 / 0.6), transparent 80%)",
          filter: "blur(20px)",
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-0 rounded-full border border-white/10"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
    </div>
  );
}

import { lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { ClientOnly } from "./ClientOnly";

const HeroScene = lazy(() => import("./HeroScene"));

function Fallback() {
  return (
    <div className="relative h-full w-full">
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, oklch(0.95 0.02 260), oklch(0.72 0.19 295) 40%, oklch(0.35 0.15 275) 70%, transparent 72%)",
          boxShadow:
            "0 30px 80px -20px oklch(0.72 0.19 295 / 0.7), inset -30px -40px 80px oklch(0.2 0.05 260 / 0.6)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

export function OrbSphere() {
  return (
    <div className="relative mx-auto h-72 w-72 md:h-96 md:w-96">
      <ClientOnly fallback={<Fallback />}>
        <Suspense fallback={<Fallback />}>
          <HeroScene />
        </Suspense>
      </ClientOnly>
    </div>
  );
}

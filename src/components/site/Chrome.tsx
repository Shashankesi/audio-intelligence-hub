import { motion, useScroll, useSpring } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUp, Plus } from "lucide-react";

/** Thin gradient scroll-progress bar pinned to the top of the viewport. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const x = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.3 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX: x }}
      className="fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-gradient-brand"
    />
  );
}

function useScrolledPast(px = 420) {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > px);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [px]);
  return past;
}

/** Back-to-top pill that fades in once the page has scrolled. */
export function BackToTop() {
  const show = useScrolledPast(500);
  return (
    <motion.button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      initial={false}
      animate={{ opacity: show ? 1 : 0, y: show ? 0 : 12, pointerEvents: show ? "auto" : "none" }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.94 }}
      className="fixed bottom-6 left-6 z-40 grid h-11 w-11 place-items-center rounded-full glass text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ArrowUp className="h-4 w-4" />
    </motion.button>
  );
}

/** Floating quick-upload action, always one click from a new transcription. */
export function QuickUploadFab() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4, type: "spring", stiffness: 240, damping: 20 }}
      className="fixed bottom-6 right-6 z-40"
    >
      <Link
        to="/dashboard/upload"
        aria-label="Quick upload audio"
        className="group relative grid h-14 w-14 place-items-center rounded-full bg-gradient-brand text-white shadow-glow transition-transform duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span aria-hidden className="absolute inset-0 rounded-full bg-gradient-brand opacity-60 blur-lg transition-opacity group-hover:opacity-90" />
        <Plus className="relative h-6 w-6 transition-transform duration-300 group-hover:rotate-90" />
      </Link>
    </motion.div>
  );
}
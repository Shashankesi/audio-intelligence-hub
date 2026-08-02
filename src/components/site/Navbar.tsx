import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Waves, Menu, X } from "lucide-react";
import { motion, useMotionValueEvent, useScroll, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Magnetic } from "./MagneticButton";

const LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#how", label: "How it works" },
  { href: "/#demo", label: "Demo" },
  { href: "/#research", label: "Research" },
  { href: "/#faq", label: "FAQ" },
];

export function Navbar() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 24);
    setHidden(y > prev && y > 180 && !open);
  });

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: hidden ? -110 : 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50 w-full px-4"
    >
      <div
        className={`mx-auto mt-4 flex max-w-6xl items-center justify-between rounded-full px-4 py-2.5 transition-all duration-500 md:px-6 ${
          scrolled ? "glass-strong shadow-soft" : "border border-transparent bg-transparent"
        }`}
      >
        <Link to="/" className="group flex items-center gap-2.5">
          <motion.span
            whileHover={{ rotate: 12, scale: 1.08 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand shadow-glow"
          >
            <Waves className="h-4 w-4 text-white" />
          </motion.span>
          <span className="font-display text-sm font-semibold tracking-tight">AudioInsight AI</span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="relative rounded-full px-3.5 py-1.5 transition-colors duration-300 hover:text-foreground"
            >
              <span className="relative z-10">{l.label}</span>
              <span className="absolute inset-0 scale-90 rounded-full bg-white/5 opacity-0 transition-all duration-300 hover:scale-100 hover:opacity-100" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden rounded-full sm:inline-flex" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
          <Magnetic strength={0.25}>
            <Button
              size="sm"
              className="rounded-full bg-gradient-brand text-white shadow-glow transition hover:opacity-95 animate-gradient-pan"
              asChild
            >
              <Link to="/dashboard">Get started</Link>
            </Button>
          </Magnetic>
          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-muted-foreground transition hover:text-foreground md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mx-auto mt-2 grid max-w-6xl gap-1 rounded-3xl glass-strong p-3 text-sm md:hidden"
          >
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-2 text-muted-foreground transition hover:bg-white/5 hover:text-foreground">
                {l.label}
              </a>
            ))}
            <Link to="/login" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2 text-muted-foreground transition hover:bg-white/5 hover:text-foreground">
              Sign in
            </Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

import { Link } from "@tanstack/react-router";
import { Github, Linkedin, Mail, FileText, Shield, BookOpen, Waves, ArrowRight, Twitter } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Reveal } from "./Motion";

export function Footer() {
  const [email, setEmail] = useState("");

  return (
    <footer className="relative mt-40 overflow-hidden border-t border-white/10">
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[26rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-[120px]" style={{ background: "var(--gradient-brand)" }} />

      <div className="relative mx-auto max-w-6xl px-6 py-20">
        <Reveal className="mb-16 grid gap-8 rounded-[2rem] glass p-8 md:grid-cols-[1.2fr_1fr] md:items-center md:p-10">
          <div>
            <h3 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
              Research notes, straight to your inbox
            </h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Monthly deep dives on speech models, evaluation methodology and product updates. No noise.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!email.includes("@")) return toast.error("Enter a valid email");
              setEmail("");
              toast.success("You're subscribed — welcome aboard.");
            }}
            className="flex gap-2"
          >
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="h-11 rounded-full border-white/10 bg-white/5"
              aria-label="Email address"
            />
            <Button type="submit" className="h-11 shrink-0 rounded-full bg-gradient-brand px-5 text-white shadow-glow">
              Subscribe <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </form>
        </Reveal>

        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <motion.span
                animate={{ rotate: [0, 8, -8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-brand shadow-glow"
              >
                <Waves className="h-5 w-5 text-white" />
              </motion.span>
              <span className="font-display text-base font-semibold">AudioInsight AI</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Speech to actionable intelligence — accurate transcription, structured summaries and evaluation you can defend.
            </p>
            <div className="mt-5 flex gap-2">
              {[Github, Linkedin, Twitter, Mail].map((Icon, i) => (
                <motion.a
                  key={i}
                  href="#"
                  whileHover={{ y: -3, scale: 1.06 }}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-muted-foreground transition hover:text-foreground"
                  aria-label="Social link"
                >
                  <Icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </div>

          <FooterCol title="Product" items={[
            { label: "Features", href: "/#features" },
            { label: "Live demo", href: "/#demo" },
            { label: "Research", href: "/#research" },
          ]} />

          <div>
            <h4 className="text-sm font-semibold">Workspace</h4>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li><Link to="/dashboard" className="transition hover:text-foreground">Dashboard</Link></li>
              <li><Link to="/dashboard/upload" className="transition hover:text-foreground">Upload audio</Link></li>
              <li><Link to="/login" className="transition hover:text-foreground">Sign in</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Resources</h4>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2 transition hover:text-foreground"><BookOpen className="h-4 w-4" /> Documentation</li>
              <li className="flex items-center gap-2 transition hover:text-foreground"><FileText className="h-4 w-4" /> Terms</li>
              <li className="flex items-center gap-2 transition hover:text-foreground"><Shield className="h-4 w-4" /> Privacy</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} AudioInsight AI. All rights reserved.</p>
          <p>Crafted for research, product and the future of listening.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold">{title}</h4>
      <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
        {items.map((i) => (
          <li key={i.label}>
            <a href={i.href} className="transition hover:text-foreground">{i.label}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

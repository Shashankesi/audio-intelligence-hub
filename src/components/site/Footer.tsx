import { Link } from "@tanstack/react-router";
import { Github, Linkedin, Mail, FileText, Shield, BookOpen, Waves } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-background/40">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand shadow-glow">
                <Waves className="h-4 w-4 text-white" />
              </span>
              <span className="text-sm font-semibold">AudioInsight AI</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Speech to actionable intelligence. Powered by Faster-Whisper and Groq.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Product</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="/#features" className="hover:text-foreground">Features</a></li>
              <li><a href="/#demo" className="hover:text-foreground">Demo</a></li>
              <li><Link to="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Resources</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> Documentation</li>
              <li className="flex items-center gap-2"><FileText className="h-4 w-4" /> Terms</li>
              <li className="flex items-center gap-2"><Shield className="h-4 w-4" /> Privacy</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Connect</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Github className="h-4 w-4" /> GitHub</li>
              <li className="flex items-center gap-2"><Linkedin className="h-4 w-4" /> LinkedIn</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> hello@audioinsight.ai</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} AudioInsight AI. All rights reserved.</p>
          <p>Crafted for research, product and the future of listening.</p>
        </div>
      </div>
    </footer>
  );
}

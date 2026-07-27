import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Waves } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full px-4">
      <div className="mx-auto mt-4 flex max-w-6xl items-center justify-between rounded-2xl glass px-4 py-2.5 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand shadow-glow">
            <Waves className="h-4 w-4 text-white" />
          </span>
          <span className="text-sm font-semibold tracking-tight">AudioInsight AI</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="/#features" className="transition hover:text-foreground">Features</a>
          <a href="/#how" className="transition hover:text-foreground">How it works</a>
          <a href="/#demo" className="transition hover:text-foreground">Demo</a>
          <a href="/#research" className="transition hover:text-foreground">Research</a>
          <a href="/#faq" className="transition hover:text-foreground">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
          <Button size="sm" className="bg-gradient-brand text-white shadow-glow hover:opacity-95" asChild>
            <Link to="/dashboard">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

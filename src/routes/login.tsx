import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Waves, Mail, Lock, ArrowRight } from "lucide-react";
import { Backdrop } from "@/components/site/Backdrop";
import { OrbSphere } from "@/components/site/OrbSphere";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — AudioInsight AI" }, { name: "description", content: "Sign in to your AudioInsight AI workspace." }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pw) return toast.error("Please fill in both fields.");
    toast.success("Signed in — welcome back!");
    nav({ to: "/dashboard" });
  };
  return (
    <div className="relative min-h-screen">
      <Backdrop />
      <div className="mx-auto grid min-h-screen max-w-6xl gap-10 px-6 py-10 md:grid-cols-2 md:items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="hidden md:block">
          <div className="mb-6 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand shadow-glow"><Waves className="h-5 w-5 text-white" /></span>
            <span className="text-lg font-semibold">AudioInsight AI</span>
          </div>
          <h1 className="text-3xl font-bold md:text-4xl">Welcome back.<br /><span className="text-gradient">Your audio is waiting.</span></h1>
          <p className="mt-3 max-w-md text-muted-foreground">Pick up where you left off — transcripts, summaries and decisions in one place.</p>
          <div className="mt-10"><OrbSphere /></div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass border-white/10">
            <CardContent className="p-8">
              <h2 className="text-xl font-semibold">Sign in</h2>
              <p className="mt-1 text-sm text-muted-foreground">Use your email and password.</p>
              <form onSubmit={submit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative"><Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="pl-9" placeholder="you@company.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between"><Label htmlFor="pw">Password</Label>
                    <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">Forgot password?</Link>
                  </div>
                  <div className="relative"><Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="pw" type="password" value={pw} onChange={e => setPw(e.target.value)} className="pl-9" placeholder="••••••••" />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-gradient-brand text-white shadow-glow">Continue <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">Don't have an account? <Link to="/signup" className="text-foreground hover:underline">Sign up</Link></p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

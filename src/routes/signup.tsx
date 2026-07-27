import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Waves, User, Mail, Lock, ArrowRight } from "lucide-react";
import { Backdrop } from "@/components/site/Backdrop";
import { OrbSphere } from "@/components/site/OrbSphere";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account — AudioInsight AI" }, { name: "description", content: "Create your AudioInsight AI account." }] }),
  component: SignupPage,
});

function SignupPage() {
  const nav = useNavigate();
  const [f, setF] = useState({ name: "", email: "", pw: "" });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name || !f.email || f.pw.length < 6) return toast.error("Please complete the form (password 6+ chars).");
    toast.success("Account created!");
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
          <h1 className="text-3xl font-bold md:text-4xl">Turn any recording into <span className="text-gradient">structured intelligence.</span></h1>
          <p className="mt-3 max-w-md text-muted-foreground">Free while in research. Bring your Groq API key or use our shared pool.</p>
          <div className="mt-10"><OrbSphere /></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass border-white/10">
            <CardContent className="p-8">
              <h2 className="text-xl font-semibold">Create account</h2>
              <p className="mt-1 text-sm text-muted-foreground">Start transcribing in seconds.</p>
              <form onSubmit={submit} className="mt-6 space-y-4">
                <div className="space-y-2"><Label htmlFor="name">Full name</Label>
                  <div className="relative"><User className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} className="pl-9" placeholder="Ada Lovelace" />
                  </div>
                </div>
                <div className="space-y-2"><Label htmlFor="email">Email</Label>
                  <div className="relative"><Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} className="pl-9" placeholder="you@company.com" />
                  </div>
                </div>
                <div className="space-y-2"><Label htmlFor="pw">Password</Label>
                  <div className="relative"><Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="pw" type="password" value={f.pw} onChange={e => setF({ ...f, pw: e.target.value })} className="pl-9" placeholder="At least 6 characters" />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-gradient-brand text-white shadow-glow">Create account <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">Already have an account? <Link to="/login" className="text-foreground hover:underline">Sign in</Link></p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Waves, User, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { Backdrop } from "@/components/site/Backdrop";
import { ClientOnly } from "@/components/site/ClientOnly";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { lazy, Suspense } from "react";

const AuthScene = lazy(() => import("@/components/site/AuthScene"));

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account — AudioInsight AI" }, { name: "description", content: "Create your AudioInsight AI account." }] }),
  component: SignupPage,
});

function SignupPage() {
  const nav = useNavigate();
  const [f, setF] = useState({ name: "", email: "", pw: "" });
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name || !f.email || f.pw.length < 6) return toast.error("Please complete the form (password 6+ chars).");
    setLoading(true);
    const { error, data } = await supabase.auth.signUp({
      email: f.email,
      password: f.pw,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { display_name: f.name },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created!");
    if (data.session) nav({ to: "/dashboard" });
    else toast.message("Check your email to confirm your account.");
  };
  const google = async () => {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) return toast.error(res.error.message || "Google sign-in failed");
    if (!res.redirected) nav({ to: "/dashboard" });
  };
  return (
    <div className="relative min-h-screen">
      <Backdrop />
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <ClientOnly>
          <Suspense fallback={null}>
            <AuthScene />
          </Suspense>
        </ClientOnly>
      </div>
      <div className="mx-auto grid min-h-screen max-w-6xl gap-10 px-6 py-10 md:grid-cols-2 md:items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 hidden md:block">
          <div className="mb-6 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand shadow-glow"><Waves className="h-5 w-5 text-white" /></span>
            <span className="text-lg font-semibold">AudioInsight AI</span>
          </div>
          <h1 className="text-3xl font-bold md:text-4xl">Turn any recording into <span className="text-gradient">structured intelligence.</span></h1>
          <p className="mt-3 max-w-md text-muted-foreground">Upload up to 60 minutes of audio and get transcripts, action items and sentiment in minutes.</p>
          <ul className="mt-10 max-w-md space-y-3">
            {[
              "Whisper-grade transcription with speaker-friendly formatting",
              "Executive summaries, key points and owned action items",
              "Searchable history, exports and evaluation dashboards",
            ].map((t) => (
              <li key={t} className="glass flex items-start gap-3 rounded-xl border border-white/10 px-4 py-3 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-brand" />{t}
              </li>
            ))}
          </ul>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 90, damping: 16 }} className="relative z-10">
          <Card className="glass border-white/10 shadow-glow">
            <CardContent className="p-8">
              <h2 className="text-xl font-semibold">Create account</h2>
              <p className="mt-1 text-sm text-muted-foreground">Start transcribing in seconds.</p>
              <Button type="button" variant="outline" onClick={google} className="mt-6 w-full border-white/15 bg-white/5">
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.68 4.1-5.5 4.1-3.3 0-6-2.73-6-6.1s2.7-6.1 6-6.1c1.88 0 3.14.8 3.86 1.5l2.63-2.53C16.86 3.4 14.66 2.4 12 2.4 6.9 2.4 2.8 6.5 2.8 11.6s4.1 9.2 9.2 9.2c5.31 0 8.83-3.73 8.83-8.99 0-.6-.06-1.06-.14-1.51H12z"/></svg>
                Continue with Google
              </Button>
              <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
                <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
              </div>
              <form onSubmit={submit} className="space-y-4">
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
                <Button type="submit" disabled={loading} className="w-full bg-gradient-brand text-white shadow-glow">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create account <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">Already have an account? <Link to="/login" className="text-foreground hover:underline">Sign in</Link></p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

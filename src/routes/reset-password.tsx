import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Loader2 } from "lucide-react";
import { Backdrop } from "@/components/site/Backdrop";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set new password — AudioInsight AI" },
      { name: "description", content: "Choose a new password for your account." },
      { property: "og:title", content: "Reset password — AudioInsight AI" },
      { property: "og:description", content: "Choose a new password for your AudioInsight AI account." },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) return toast.error("Password must be at least 6 characters.");
    if (pw !== pw2) return toast.error("Passwords do not match.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated.");
    nav({ to: "/dashboard" });
  };

  return (
    <div className="relative grid min-h-screen place-items-center px-6">
      <Backdrop />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="glass border-white/10">
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold">Set a new password</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {ready ? "Almost done — choose a new password." : "Verifying your reset link…"}
            </p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pw">New password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="pw" type="password" value={pw} onChange={e => setPw(e.target.value)} className="pl-9" placeholder="At least 6 characters" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pw2">Confirm password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="pw2" type="password" value={pw2} onChange={e => setPw2(e.target.value)} className="pl-9" />
                </div>
              </div>
              <Button type="submit" disabled={!ready || loading} className="w-full bg-gradient-brand text-white shadow-glow">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Update password
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link to="/login" className="text-foreground hover:underline">Back to sign in</Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
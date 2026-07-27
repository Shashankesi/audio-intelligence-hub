import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { Backdrop } from "@/components/site/Backdrop";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — AudioInsight AI" }, { name: "description", content: "Reset your AudioInsight AI password." }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <div className="relative grid min-h-screen place-items-center px-6">
      <Backdrop />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="glass border-white/10">
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold">Forgot your password?</h2>
            <p className="mt-1 text-sm text-muted-foreground">We'll email you a secure reset link.</p>
            {sent ? (
              <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
                If an account exists for <span className="text-foreground">{email}</span>, a reset link is on its way.
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); if (!email) return toast.error("Enter your email."); setSent(true); toast.success("Reset link sent."); }} className="mt-6 space-y-4">
                <div className="space-y-2"><Label htmlFor="email">Email</Label>
                  <div className="relative"><Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="pl-9" placeholder="you@company.com" />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-gradient-brand text-white shadow-glow">Send reset link</Button>
              </form>
            )}
            <p className="mt-6 text-center text-sm text-muted-foreground"><Link to="/login" className="text-foreground hover:underline">Back to sign in</Link></p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

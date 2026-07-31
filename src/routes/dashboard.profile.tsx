import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatedCounter } from "@/components/site/AnimatedCounter";
import { Loader2, LogOut, ShieldCheck, Clock, Sparkles } from "lucide-react";

export const Route = createFileRoute("/dashboard/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Profile — AudioInsight AI" },
      { name: "description", content: "Manage your AudioInsight AI account, view usage statistics and recent transcription activity." },
      { property: "og:title", content: "Profile — AudioInsight AI" },
      { property: "og:description", content: "Your account details and workspace usage." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const STORAGE_QUOTA_MB = 1024;

function ProfilePage() {
  const { user } = useSession();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await (supabase.from("profiles") as any).select("*").eq("id", user!.id).maybeSingle()).data,
  });

  const { data: recs = [] } = useQuery({
    queryKey: ["recordings"],
    queryFn: async () =>
      ((await (supabase.from("recordings") as any)
        .select("id, name, size_bytes, status, duration_sec, created_at")
        .order("created_at", { ascending: false })).data ?? []) as any[],
  });

  useEffect(() => { if (profile) setName(profile.display_name ?? ""); }, [profile?.display_name]);

  const initials = (name || user?.email || "AI").slice(0, 2).toUpperCase();
  const totalMB = recs.reduce((s, r) => s + (r.size_bytes ?? 0), 0) / 1024 / 1024;
  const minutes = recs.reduce((s, r) => s + (r.duration_sec ?? 0), 0) / 60;
  const done = recs.filter((r) => r.status === "done").length;
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "—";

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const r = await (supabase.from("profiles") as any).update({ display_name: name }).eq("id", user.id);
    setSaving(false);
    if (r.error) return toast.error(r.error.message);
    qc.invalidateQueries({ queryKey: ["profile", user.id] });
    toast.success("Profile saved");
  };

  const resetPassword = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return toast.error(error.message);
    toast.success("Password reset link sent to your email.");
  };

  return (
    <PageShell title="Profile" description="Your account, usage and recent activity.">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="glass relative overflow-hidden border-white/10 lg:col-span-1">
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-brand opacity-30 blur-2xl" />
          <CardContent className="relative p-6 text-center">
            <Avatar className="mx-auto h-24 w-24 ring-2 ring-white/20">
              <AvatarFallback className="bg-gradient-brand text-2xl text-white">{initials}</AvatarFallback>
            </Avatar>
            <div className="mt-3 text-lg font-semibold">{name || "Unnamed"}</div>
            <div className="text-xs text-muted-foreground">{user?.email}</div>
            <div className="mt-2 flex justify-center gap-2">
              <Badge className="bg-gradient-brand text-white">Pro</Badge>
              <Badge variant="outline" className="border-white/15">Member since {memberSince}</Badge>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              {[
                [recs.length, "Uploads"],
                [done, "Completed"],
                [Math.round(minutes), "Minutes"],
              ].map(([v, l]) => (
                <div key={l as string} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <div className="text-lg font-bold text-gradient"><AnimatedCounter value={v as number} /></div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{l}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 text-left">
              <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                <span>Storage used</span><span>{totalMB.toFixed(1)} / {STORAGE_QUOTA_MB} MB</span>
              </div>
              <Progress value={Math.min(100, (totalMB / STORAGE_QUOTA_MB) * 100)} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card className="glass border-white/10">
            <CardContent className="space-y-4 p-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4" /> Account</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Display name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="bg-white/5" /></div>
                <div className="space-y-2"><Label>Email</Label><Input value={user?.email ?? ""} disabled className="bg-white/5" /></div>
                <div className="space-y-2"><Label>Default model</Label><Input value={(profile?.default_model ?? "").split("/").pop() ?? "—"} disabled className="bg-white/5" /></div>
                <div className="space-y-2"><Label>Default language</Label><Input value={profile?.default_language ?? "auto"} disabled className="bg-white/5" /></div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button disabled={saving} className="bg-gradient-brand text-white shadow-glow" onClick={save}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Save changes
                </Button>
                <Button variant="outline" className="border-white/15 bg-white/5" asChild><Link to="/dashboard/settings">Change defaults</Link></Button>
                <Button variant="outline" className="border-white/15 bg-white/5" onClick={resetPassword}><ShieldCheck className="mr-2 h-4 w-4" /> Reset password</Button>
                <Button variant="ghost" className="text-muted-foreground" onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/10">
            <CardContent className="p-6">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Clock className="h-4 w-4" /> Recent activity</h3>
              {recs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recordings yet — <Link to="/dashboard/upload" className="text-foreground underline">upload your first meeting</Link>.</p>
              ) : (
                <div className="space-y-2">
                  {recs.slice(0, 5).map((r) => (
                    <Link
                      key={r.id}
                      to="/dashboard/summary"
                      search={{ id: r.id } as any}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm transition hover:bg-white/[0.07]"
                    >
                      <span className="truncate pr-3">{r.name}</span>
                      <span className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{new Date(r.created_at).toLocaleDateString()}</span>
                        <Badge variant="outline" className="border-white/15 capitalize">{r.status}</Badge>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

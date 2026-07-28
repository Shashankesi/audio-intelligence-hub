import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/dashboard/profile")({ component: ProfilePage });

function ProfilePage() {
  const { user } = useSession();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const r = await (supabase.from("profiles") as any).select("*").eq("id", user!.id).maybeSingle();
      return r.data;
    },
  });
  const { data: recs = [] } = useQuery({
    queryKey: ["recordings"],
    queryFn: async () => {
      const r = await (supabase.from("recordings") as any).select("id, size_bytes, status");
      return (r.data ?? []) as any[];
    },
  });

  useEffect(() => { if (profile) setName(profile.display_name ?? ""); }, [profile?.display_name]);

  const initials = (name || user?.email || "AI").slice(0, 2).toUpperCase();
  const totalMB = recs.reduce((s, r) => s + (r.size_bytes ?? 0), 0) / 1024 / 1024;
  const done = recs.filter((r) => r.status === "done").length;

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const r = await (supabase.from("profiles") as any).update({ display_name: name }).eq("id", user.id);
    setSaving(false);
    if (r.error) return toast.error(r.error.message);
    toast.success("Profile saved");
  };

  return (
    <PageShell title="Profile" description="Your account, statistics and preferences.">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="glass border-white/10 lg:col-span-1">
          <CardContent className="p-6 text-center">
            <Avatar className="mx-auto h-20 w-20"><AvatarFallback className="bg-gradient-brand text-white">{initials}</AvatarFallback></Avatar>
            <div className="mt-3 text-lg font-semibold">{name || "—"}</div>
            <div className="text-xs text-muted-foreground">{user?.email}</div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              {[[recs.length.toString(),"Uploads"],[done.toString(),"Done"],[totalMB.toFixed(1),"MB used"]].map(([v,l]) => (
                <div key={l as string} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <div className="text-lg font-bold text-gradient">{v}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{l}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-white/10 lg:col-span-2">
          <CardContent className="space-y-4 p-6">
            <h3 className="text-sm font-semibold">Account</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Display name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="bg-white/5" /></div>
              <div className="space-y-2"><Label>Email</Label><Input value={user?.email ?? ""} disabled className="bg-white/5" /></div>
            </div>
            <Button disabled={saving} className="bg-gradient-brand text-white shadow-glow" onClick={save}>Save changes</Button>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

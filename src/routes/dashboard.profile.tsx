import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/profile")({ component: ProfilePage });

function ProfilePage() {
  return (
    <PageShell title="Profile" description="Your account, statistics and preferences.">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="glass border-white/10 lg:col-span-1">
          <CardContent className="p-6 text-center">
            <Avatar className="mx-auto h-20 w-20"><AvatarFallback className="bg-gradient-brand text-white">AL</AvatarFallback></Avatar>
            <div className="mt-3 text-lg font-semibold">Ada Lovelace</div>
            <div className="text-xs text-muted-foreground">ada@analytical.engine</div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              {[["248","Uploads"],["231","Summaries"],["3.2","GB used"]].map(([v,l]) => (
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
              <div className="space-y-2"><Label>Full name</Label><Input defaultValue="Ada Lovelace" className="bg-white/5" /></div>
              <div className="space-y-2"><Label>Email</Label><Input defaultValue="ada@analytical.engine" className="bg-white/5" /></div>
              <div className="space-y-2 sm:col-span-2"><Label>API Key (Groq)</Label><Input defaultValue="gsk_••••••••••••••••" type="password" className="bg-white/5" /></div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
              <div><div className="text-sm font-medium">Dark mode</div><div className="text-xs text-muted-foreground">Optimized for late-night listening.</div></div>
              <Switch defaultChecked />
            </div>
            <Button className="bg-gradient-brand text-white shadow-glow" onClick={() => toast.success("Profile saved")}>Save changes</Button>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

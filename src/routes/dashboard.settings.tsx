import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/settings")({ component: SettingsPage });

function SettingsPage() {
  return (
    <PageShell title="Settings" description="Fine-tune models, keys and preferences.">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass border-white/10"><CardContent className="space-y-4 p-6">
          <h3 className="text-sm font-semibold">AI providers</h3>
          <div className="space-y-2"><Label>Groq API key</Label><Input placeholder="gsk_…" className="bg-white/5" /></div>
          <div className="space-y-2"><Label>Default Whisper model</Label>
            <Select defaultValue="small"><SelectTrigger className="bg-white/5"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="base">Base</SelectItem><SelectItem value="small">Small</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Language</Label>
            <Select defaultValue="auto"><SelectTrigger className="bg-white/5"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="auto">Auto-detect</SelectItem><SelectItem value="en">English</SelectItem><SelectItem value="es">Spanish</SelectItem><SelectItem value="fr">French</SelectItem></SelectContent>
            </Select>
          </div>
        </CardContent></Card>
        <Card className="glass border-white/10"><CardContent className="space-y-4 p-6">
          <h3 className="text-sm font-semibold">Preferences</h3>
          {[
            ["Email me when jobs complete", true],
            ["Weekly usage summary", true],
            ["Product updates", false],
            ["Enable dark mode", true],
          ].map(([l, v]) => (
            <div key={l as string} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
              <span className="text-sm">{l as string}</span><Switch defaultChecked={v as boolean} />
            </div>
          ))}
          <Button className="bg-gradient-brand text-white shadow-glow" onClick={() => toast.success("Settings saved")}>Save</Button>
        </CardContent></Card>
      </div>
    </PageShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Download, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/transcription")({ component: Transcription });

const sample = `00:12  Priya: The streaming release looked healthy through the weekend. Latency is down about 40% and error rates are flat.
00:37  Marco: On pricing, the copy variant is beating control but the sample is still small. I'd like to hold another week before rolling broadly.
01:04  Ana: I'll pull the numbers Thursday. Also, we need to lock the Q4 roadmap by end of week — I'll circulate a doc tonight.
01:41  Priya: Sounds good. Let's plan a short retro on the streaming rollout on Friday.`;

function Transcription() {
  const [text, setText] = useState(sample);
  const [q, setQ] = useState("");
  const words = text.trim().split(/\s+/).length;
  return (
    <PageShell
      title="Transcription"
      description="Edit, search and export your transcript."
      actions={
        <div className="flex items-center gap-2">
          <Select defaultValue="small">
            <SelectTrigger className="h-9 w-32 bg-white/5"><SelectValue placeholder="Model" /></SelectTrigger>
            <SelectContent><SelectItem value="base">Base</SelectItem><SelectItem value="small">Small</SelectItem></SelectContent>
          </Select>
          <Button variant="outline" className="border-white/15 bg-white/5" onClick={() => { navigator.clipboard.writeText(text); toast.success("Copied"); }}><Copy className="mr-2 h-4 w-4" /> Copy</Button>
          <Button className="bg-gradient-brand text-white shadow-glow" onClick={() => toast.success("Download queued")}><Download className="mr-2 h-4 w-4" /> Download</Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="glass border-white/10 lg:col-span-2">
          <CardContent className="p-5">
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search transcript…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 bg-white/5 pl-9" />
            </div>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-[420px] resize-y bg-white/[0.02] font-mono text-sm leading-relaxed" />
          </CardContent>
        </Card>
        <Card className="glass border-white/10">
          <CardContent className="space-y-4 p-5 text-sm">
            <Stat label="Word count" value={words.toString()} />
            <Stat label="Speaking duration" value="32:14" />
            <Stat label="Speakers" value="3" />
            <Stat label="Language" value="English" />
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

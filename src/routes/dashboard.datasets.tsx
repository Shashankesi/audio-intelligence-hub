import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Plus } from "lucide-react";

export const Route = createFileRoute("/dashboard/datasets")({ component: DatasetsPage });

const sets = [
  { name: "LibriSpeech test-clean", size: "5.4h", type: "ASR benchmark" },
  { name: "AMI Meeting Corpus", size: "100h", type: "Meetings" },
  { name: "TED-LIUM v3", size: "452h", type: "Talks" },
  { name: "SPGISpeech", size: "5,000h", type: "Financial calls" },
];

function DatasetsPage() {
  return (
    <PageShell title="Datasets" description="Reference corpora used for evaluation and fine-tuning." actions={<Button className="bg-gradient-brand text-white shadow-glow"><Plus className="mr-2 h-4 w-4" /> New dataset</Button>}>
      <div className="grid gap-4 md:grid-cols-2">
        {sets.map(s => (
          <Card key={s.name} className="glass border-white/10 transition hover:-translate-y-0.5 hover:shadow-glow">
            <CardContent className="flex items-center gap-4 p-5">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-brand shadow-glow"><Database className="h-5 w-5 text-white" /></span>
              <div className="flex-1">
                <div className="font-semibold">{s.name}</div>
                <div className="text-xs text-muted-foreground">{s.type}</div>
              </div>
              <div className="text-sm text-muted-foreground">{s.size}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}

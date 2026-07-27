import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, RadarChart, PolarAngleAxis, PolarGrid, Radar } from "recharts";

export const Route = createFileRoute("/dashboard/evaluation")({ component: EvalPage });

const metrics = [
  { label: "WER", desc: "Word Error Rate" },
  { label: "ROUGE-L", desc: "Summary overlap" },
  { label: "BERTScore", desc: "Semantic similarity" },
  { label: "Inference Time", desc: "Per minute of audio" },
  { label: "CPU Performance", desc: "Throughput" },
];
const trend = Array.from({ length: 10 }).map((_, i) => ({ run: "r" + (i + 1), score: 60 + ((i * 11) % 30) }));
const radar = [
  { m: "WER", v: 70 }, { m: "ROUGE", v: 82 }, { m: "BERT", v: 88 }, { m: "Time", v: 76 }, { m: "CPU", v: 68 },
];

function EvalPage() {
  return (
    <PageShell title="Evaluation" description="Ready-made slots for your research metrics. Values appear after your evaluation run.">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {metrics.map(m => (
          <Card key={m.label} className="glass border-white/10">
            <CardContent className="p-4">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{m.label}</div>
              <div className="mt-1 text-2xl font-bold text-gradient">—</div>
              <div className="mt-1 text-[11px] text-muted-foreground">{m.desc}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="glass border-white/10"><CardContent className="p-5">
          <h3 className="mb-2 text-sm font-semibold">Score trend</h3>
          <div className="h-64"><ResponsiveContainer>
            <LineChart data={trend}>
              <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
              <XAxis dataKey="run" stroke="oklch(1 0 0 / 0.4)" fontSize={11} />
              <YAxis stroke="oklch(1 0 0 / 0.4)" fontSize={11} />
              <Tooltip contentStyle={{ background: "oklch(0.2 0.03 265)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8 }} />
              <Line type="monotone" dataKey="score" stroke="oklch(0.72 0.19 295)" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer></div>
        </CardContent></Card>
        <Card className="glass border-white/10"><CardContent className="p-5">
          <h3 className="mb-2 text-sm font-semibold">Model profile</h3>
          <div className="h-64"><ResponsiveContainer>
            <RadarChart data={radar}>
              <PolarGrid stroke="oklch(1 0 0 / 0.1)" />
              <PolarAngleAxis dataKey="m" stroke="oklch(1 0 0 / 0.5)" fontSize={11} />
              <Radar dataKey="v" stroke="oklch(0.78 0.16 175)" fill="oklch(0.78 0.16 175)" fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer></div>
        </CardContent></Card>
      </div>
    </PageShell>
  );
}

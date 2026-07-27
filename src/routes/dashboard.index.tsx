import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Upload, FileText, Sparkles, HardDrive, ArrowUpRight, Waves } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";

export const Route = createFileRoute("/dashboard/")({
  component: Overview,
});

const data = Array.from({ length: 14 }).map((_, i) => ({ d: "D" + (i + 1), uploads: 4 + ((i * 7) % 12), minutes: 20 + ((i * 13) % 60) }));
const stats = [
  { label: "Total Uploads", value: "248", icon: Upload, delta: "+12%" },
  { label: "Total Summaries", value: "231", icon: Sparkles, delta: "+9%" },
  { label: "Avg Processing", value: "42s", icon: FileText, delta: "-8%" },
  { label: "Storage Used", value: "3.2 GB", icon: HardDrive, delta: "+180 MB" },
];

function Overview() {
  return (
    <PageShell
      title="Overview"
      description="Your workspace at a glance."
      actions={<Button asChild className="bg-gradient-brand text-white shadow-glow"><Link to="/dashboard/upload"><Upload className="mr-2 h-4 w-4" /> New upload</Link></Button>}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="glass border-white/10">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="uppercase tracking-widest">{s.label}</span>
                  <s.icon className="h-4 w-4" />
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <div className="text-2xl font-bold">{s.value}</div>
                  <span className="text-xs text-emerald-300">{s.delta}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="glass border-white/10 lg:col-span-2">
          <CardContent className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Processing activity</h3>
              <span className="text-xs text-muted-foreground">Last 14 days</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.72 0.19 295)" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="oklch(0.72 0.19 295)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
                  <XAxis dataKey="d" stroke="oklch(1 0 0 / 0.4)" fontSize={11} />
                  <YAxis stroke="oklch(1 0 0 / 0.4)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "oklch(0.2 0.03 265)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="minutes" stroke="oklch(0.72 0.19 295)" fill="url(#g1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-white/10">
          <CardContent className="p-5">
            <h3 className="mb-2 text-sm font-semibold">Uploads per day</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={data}>
                  <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
                  <XAxis dataKey="d" stroke="oklch(1 0 0 / 0.4)" fontSize={11} />
                  <YAxis stroke="oklch(1 0 0 / 0.4)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "oklch(0.2 0.03 265)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8 }} />
                  <Bar dataKey="uploads" fill="oklch(0.75 0.17 220)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 glass border-white/10">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Recent activity</h3>
            <Link to="/dashboard/history" className="text-xs text-muted-foreground hover:text-foreground">View all <ArrowUpRight className="ml-1 inline h-3 w-3" /></Link>
          </div>
          <ul className="divide-y divide-white/10">
            {["team-sync-w42.wav","interview-anna.mp3","lecture-cnn.m4a","podcast-ep41.mp3","research-notes.wav"].map((n, i) => (
              <li key={n} className="flex items-center justify-between py-3 text-sm">
                <span className="flex items-center gap-2"><Waves className="h-4 w-4 text-muted-foreground" /> {n}</span>
                <span className="text-xs text-muted-foreground">{["2m","14m","1h","3h","yesterday"][i]}</span>
                <span className="text-xs text-emerald-300">Ready</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </PageShell>
  );
}

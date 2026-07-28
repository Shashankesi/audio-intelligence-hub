import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Upload, FileText, Sparkles, HardDrive, ArrowUpRight, Waves } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/dashboard/")({
  component: Overview,
});

function Overview() {
  const { data: rows = [] } = useQuery({
    queryKey: ["recordings"],
    queryFn: async () => {
      const r = await (supabase.from("recordings") as any).select("*").order("created_at", { ascending: false });
      if (r.error) throw r.error;
      return r.data as any[];
    },
  });
  const { data: summariesCount = 0 } = useQuery({
    queryKey: ["summariesCount"],
    queryFn: async () => {
      const r = await (supabase.from("summaries") as any).select("recording_id", { count: "exact", head: true });
      return r.count ?? 0;
    },
  });

  const totalBytes = rows.reduce((s, r) => s + (r.size_bytes ?? 0), 0);
  const gb = totalBytes / 1024 / 1024 / 1024;
  const done = rows.filter((r) => r.status === "done").length;

  // Build 14-day activity
  const now = new Date();
  const bucket = new Map<string, { uploads: number; minutes: number }>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    bucket.set(key, { uploads: 0, minutes: 0 });
  }
  rows.forEach((r) => {
    const key = new Date(r.created_at).toISOString().slice(0, 10);
    const b = bucket.get(key); if (!b) return;
    b.uploads += 1;
    b.minutes += (r.duration_sec ?? 0) / 60;
  });
  const data = Array.from(bucket.entries()).map(([k, v]) => ({ d: k.slice(5), uploads: v.uploads, minutes: Math.round(v.minutes) }));

  const stats = [
    { label: "Total Uploads", value: rows.length.toString(), icon: Upload, delta: `${done} done` },
    { label: "Total Summaries", value: summariesCount.toString(), icon: Sparkles, delta: "AI generated" },
    { label: "Processed", value: `${done}/${rows.length || 0}`, icon: FileText, delta: "recordings" },
    { label: "Storage Used", value: `${gb < 0.01 ? (totalBytes / 1024 / 1024).toFixed(1) + " MB" : gb.toFixed(2) + " GB"}`, icon: HardDrive, delta: "your files" },
  ];

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
          {rows.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No recordings yet. <Link to="/dashboard/upload" className="text-foreground underline">Upload one</Link>.</div>
          ) : (
            <ul className="divide-y divide-white/10">
              {rows.slice(0, 6).map((r) => (
                <li key={r.id} className="flex items-center justify-between py-3 text-sm">
                  <Link to="/dashboard/summary" search={{ id: r.id } as any} className="flex items-center gap-2 hover:text-foreground"><Waves className="h-4 w-4 text-muted-foreground" /> {r.name}</Link>
                  <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                  <span className={"text-xs " + (r.status === "done" ? "text-emerald-300" : r.status === "failed" ? "text-red-300" : "text-amber-300")}>{r.status}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}

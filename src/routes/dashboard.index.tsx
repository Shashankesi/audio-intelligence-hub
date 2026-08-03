import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Suspense, lazy } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, FileText, Sparkles, HardDrive, ArrowUpRight, Waves, Zap, Clock, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

import { AnimatedCounter } from "@/components/site/AnimatedCounter";
import { useSession } from "@/lib/use-session";

const DashboardScene = lazy(() => import("@/components/site/DashboardScene").then((m) => ({ default: m.DashboardScene })));
const MinutesArea = lazy(() => import("@/components/site/ActivityCharts").then((m) => ({ default: m.MinutesArea })));
const UploadsBar = lazy(() => import("@/components/site/ActivityCharts").then((m) => ({ default: m.UploadsBar })));

export const Route = createFileRoute("/dashboard/")({
  component: Overview,
});

function Overview() {
  const { user } = useSession();
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
  const totalMinutes = rows.reduce((s, r) => s + (r.duration_sec ?? 0), 0) / 60;

  const hour = new Date().getHours();
  const greeting = hour < 5 ? "Working late" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const name = (user?.user_metadata?.display_name as string) || (user?.email?.split("@")[0] ?? "there");

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
    { label: "Total Uploads", value: rows.length, icon: Upload, delta: `${done} processed`, tint: "from-fuchsia-400/30 to-purple-500/10" },
    { label: "Summaries", value: summariesCount, icon: Sparkles, delta: "AI generated", tint: "from-cyan-400/30 to-sky-500/10" },
    { label: "Minutes Processed", value: Math.round(totalMinutes), icon: Clock, delta: "of audio", tint: "from-emerald-400/30 to-teal-500/10" },
    { label: "Storage Used", value: gb < 0.01 ? totalBytes / 1024 / 1024 : gb, icon: HardDrive, delta: gb < 0.01 ? "MB" : "GB", tint: "from-amber-400/30 to-orange-500/10", isFloat: true },
  ];

  return (
    <PageShell
      title={`${greeting}, ${name}`}
      description="Your intelligence workspace at a glance. Press ⌘K to jump anywhere."
      actions={<Button asChild className="bg-gradient-brand text-white shadow-glow"><Link to="/dashboard/upload"><Upload className="mr-2 h-4 w-4" /> New upload</Link></Button>}
    >
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card className="glass rounded-[28px] border-white/10 lg:col-span-2 overflow-hidden">
          <CardContent className="relative p-0">
            <Suspense fallback={<Skeleton className="h-56 w-full rounded-none bg-white/5" />}>
              <DashboardScene className="!h-56 !rounded-none !border-0" />
            </Suspense>
            <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-end p-6">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground"><Zap className="h-3 w-3" /> Live workspace</div>
              <div className="mt-1 text-xl font-semibold">Ready to turn sound into structured insight.</div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass rounded-[28px] border-white/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
              <span>Momentum</span><TrendingUp className="h-4 w-4" />
            </div>
            <div className="mt-3 text-4xl font-bold text-gradient">
              <AnimatedCounter value={done} />
            </div>
            <div className="text-xs text-muted-foreground">completed recordings</div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full bg-gradient-brand"
                initial={{ width: 0 }}
                animate={{ width: `${rows.length ? (done / rows.length) * 100 : 0}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
              <span>{rows.length - done} in progress</span>
              <span>{rows.length ? Math.round((done / rows.length) * 100) : 0}% done</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="group glass relative overflow-hidden rounded-[28px] border-white/10 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform hover:-translate-y-1 hover:border-white/20 hover:shadow-glow">
              <div className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${s.tint} opacity-70 blur-2xl transition group-hover:opacity-100`} />
              <CardContent className="relative p-5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="uppercase tracking-widest">{s.label}</span>
                  <s.icon className="h-4 w-4" />
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <div className="text-2xl font-bold">
                    <AnimatedCounter value={s.value} format={s.isFloat ? (n) => n.toFixed(2) : undefined} />
                  </div>
                  <span className="text-xs text-emerald-300">{s.delta}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="glass rounded-[28px] border-white/10 lg:col-span-2">
          <CardContent className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Processing activity</h3>
              <span className="text-xs text-muted-foreground">Last 14 days</span>
            </div>
            <div className="h-64">
              <Suspense fallback={<Skeleton className="h-full w-full rounded-2xl bg-white/5" />}>
                <MinutesArea data={data} />
              </Suspense>
            </div>
          </CardContent>
        </Card>
        <Card className="glass rounded-[28px] border-white/10">
          <CardContent className="p-5">
            <h3 className="mb-2 text-sm font-semibold">Uploads per day</h3>
            <div className="h-64">
              <Suspense fallback={<Skeleton className="h-full w-full rounded-2xl bg-white/5" />}>
                <UploadsBar data={data} />
              </Suspense>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 glass rounded-[28px] border-white/10">
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

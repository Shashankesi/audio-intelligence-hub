import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/dashboard/history")({ component: HistoryPage });

const rows = [
  { name: "team-sync-w42.wav", duration: "32:14", lang: "EN", model: "Small", date: "Today", status: "Ready" },
  { name: "interview-anna.mp3", duration: "28:11", lang: "EN", model: "Base", date: "Today", status: "Ready" },
  { name: "lecture-cnn.m4a", duration: "54:22", lang: "EN", model: "Small", date: "Yesterday", status: "Ready" },
  { name: "podcast-ep41.mp3", duration: "41:07", lang: "EN", model: "Small", date: "Sep 12", status: "Ready" },
  { name: "founders-standup.wav", duration: "12:04", lang: "EN", model: "Base", date: "Sep 11", status: "Processing" },
  { name: "user-interview-06.flac", duration: "48:37", lang: "EN", model: "Small", date: "Sep 09", status: "Ready" },
];

function HistoryPage() {
  const [q, setQ] = useState("");
  const filtered = rows.filter(r => r.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <PageShell title="History" description="All your recordings and generations.">
      <Card className="glass border-white/10">
        <CardContent className="p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-64">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search recordings…" className="h-9 bg-white/5 pl-9" />
            </div>
            <Button variant="outline" className="border-white/15 bg-white/5">Filter</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10"><TableHead>Name</TableHead><TableHead>Duration</TableHead><TableHead>Lang</TableHead><TableHead>Model</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.name} className="border-white/10">
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.duration}</TableCell>
                  <TableCell>{r.lang}</TableCell>
                  <TableCell>{r.model}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>
                    <span className={"rounded-full px-2 py-0.5 text-xs " + (r.status === "Ready" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300")}>{r.status}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost"><Download className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost"><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>Showing {filtered.length} of {rows.length}</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
              <span>1 / 4</span>
              <Button variant="ghost" size="icon"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}

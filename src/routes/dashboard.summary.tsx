import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, Share2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/summary")({ component: SummaryPage });

function SummaryPage() {
  return (
    <PageShell
      title="Summary"
      description="AI-generated insights for your recording."
      actions={
        <div className="flex gap-2">
          <Button variant="outline" className="border-white/15 bg-white/5" onClick={() => { navigator.clipboard.writeText("summary"); toast.success("Copied"); }}><Copy className="mr-2 h-4 w-4" /> Copy</Button>
          <Button variant="outline" className="border-white/15 bg-white/5"><Share2 className="mr-2 h-4 w-4" /> Share</Button>
          <Button className="bg-gradient-brand text-white shadow-glow"><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
        </div>
      }
    >
      <Tabs defaultValue="short">
        <TabsList className="border border-white/10 bg-white/5 backdrop-blur">
          {[
            ["short", "Short"], ["detailed", "Detailed"], ["bullets", "Bullets"],
            ["actions", "Action items"], ["decisions", "Decisions"], ["topics", "Topics"], ["sentiment", "Sentiment"],
          ].map(([v, l]) => (
            <TabsTrigger key={v} value={v} className="data-[state=active]:bg-gradient-brand data-[state=active]:text-white">{l}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="short" className="mt-6">
          <Card className="glass border-white/10"><CardContent className="p-6 text-sm text-muted-foreground">
            Streaming rollout is stable with a 40% latency win. Pricing A/B looks positive but needs a larger sample. Q4 roadmap review moves to Thursday.
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="detailed" className="mt-6">
          <Card className="glass border-white/10"><CardContent className="p-6 space-y-3 text-sm text-muted-foreground">
            <p>The team confirmed the streaming endpoint has been stable for four days with a ~40% latency improvement and unchanged error rates. Marco reported the pricing copy variant is outperforming control, but with a small sample he prefers to extend the test one week before making a broad call.</p>
            <p>Ana will pull the pricing numbers Thursday and circulate the Q4 roadmap doc tonight. A short retro on the streaming rollout is scheduled for Friday.</p>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="bullets" className="mt-6">
          <Card className="glass border-white/10"><CardContent className="p-6 text-sm text-muted-foreground">
            <ul className="space-y-1.5">
              <li>• Streaming stable, latency −40%, errors flat.</li>
              <li>• Pricing A/B trending up; extend one week.</li>
              <li>• Q4 roadmap doc going out tonight.</li>
              <li>• Retro on streaming: Friday.</li>
            </ul>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="actions" className="mt-6">
          <Card className="glass border-white/10"><CardContent className="p-6 space-y-2 text-sm">
            {[
              ["Marco", "Extend pricing A/B one more week"],
              ["Priya", "Publish latency post-mortem"],
              ["Ana", "Draft Q4 roadmap doc"],
            ].map(([o, t]) => (
              <div key={t} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                <span>{t}</span><Badge className="bg-gradient-brand text-white">{o}</Badge>
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="decisions" className="mt-6">
          <Card className="glass border-white/10"><CardContent className="p-6 text-sm text-muted-foreground">
            <ul className="space-y-1.5"><li>• Ship streaming broadly.</li><li>• Delay pricing decision one week.</li></ul>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="topics" className="mt-6">
          <Card className="glass border-white/10"><CardContent className="p-6 flex flex-wrap gap-2">
            {["Streaming","Pricing","Roadmap","Latency","Retro","Q4"].map(t => <Badge key={t} className="bg-white/10 text-foreground">{t}</Badge>)}
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="sentiment" className="mt-6">
          <Card className="glass border-white/10"><CardContent className="p-6 space-y-3 text-sm">
            {[["Positive", 68], ["Neutral", 26], ["Negative", 6]].map(([k, v]) => (
              <div key={k as string}>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>{k}</span><span>{v}%</span></div>
                <div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-gradient-brand" style={{ width: v + "%" }} /></div>
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

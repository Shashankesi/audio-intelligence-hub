import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Mic, Sparkles, FileText, ListChecks, ClipboardCheck, Languages, Download, Search,
  History as HistoryIcon, Zap, Timer, MessagesSquare, UploadCloud, Waves, ArrowRight,
  Play, LineChart as LineIcon, ShieldCheck, Bot, Layers, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Backdrop } from "@/components/site/Backdrop";
import { SectionHeading } from "@/components/site/SectionHeading";
import { LaptopMock } from "@/components/site/LaptopMock";
import { HeroComposition } from "@/components/site/HeroComposition";
import { LiveWaveform } from "@/components/site/LiveWaveform";
import { GlowCard } from "@/components/site/GlowCard";
import { Magnetic } from "@/components/site/MagneticButton";
import { Reveal, StaggerGroup, StaggerItem, EASE } from "@/components/site/Motion";
import { AnimatedCounter } from "@/components/site/AnimatedCounter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AudioInsight AI — Transform Speech into Actionable Intelligence" },
      { name: "description", content: "Turn any recording into precise transcripts and structured summaries with Faster-Whisper and Groq." },
      { property: "og:title", content: "AudioInsight AI" },
      { property: "og:description", content: "Speech to actionable intelligence for teams, researchers and creators." },
    ],
  }),
  component: LandingPage,
});

const features = [
  { icon: Mic, title: "AI Speech Recognition", desc: "State-of-the-art Faster-Whisper transcription with speaker-friendly output." },
  { icon: MessagesSquare, title: "Meeting Summarization", desc: "Turn 60-minute calls into crisp minutes with themes and next steps." },
  { icon: FileText, title: "Lecture Notes", desc: "Structured notes for classes and talks with headings and highlights." },
  { icon: Sparkles, title: "Conversation Summary", desc: "Groq-powered LLM condenses long-form conversations in seconds." },
  { icon: ListChecks, title: "Action Items", desc: "Extract owners, tasks and deadlines automatically from any transcript." },
  { icon: ClipboardCheck, title: "Key Decisions", desc: "Never lose a decision — pinned, timestamped and searchable." },
  { icon: Timer, title: "Timeline Extraction", desc: "Auto-build a timeline of topics discussed with jump-to-moment links." },
  { icon: Languages, title: "Multi-language Support", desc: "Transcribe and summarize across 90+ languages out of the box." },
  { icon: Download, title: "Download PDF", desc: "One-click export for polished summaries and full transcripts." },
  { icon: Search, title: "Transcript Search", desc: "Full-text search across every recording in your library." },
  { icon: HistoryIcon, title: "History", desc: "Version history, replays and re-runs with new models anytime." },
  { icon: Zap, title: "Fast Processing", desc: "Faster-Whisper + Groq deliver up to 3× faster turnaround." },
];

const steps = [
  { icon: UploadCloud, title: "Upload Audio", desc: "Drop MP3, WAV, FLAC, OGG or M4A files up to 500MB." },
  { icon: Mic, title: "Speech Recognition", desc: "Faster-Whisper transcribes with high accuracy on CPU or GPU." },
  { icon: Bot, title: "AI Summarization", desc: "Groq LLMs generate summaries, decisions and action items." },
  { icon: FileText, title: "View Transcript", desc: "Editable, searchable transcript with word timestamps." },
  { icon: Download, title: "Download Summary", desc: "Export polished PDF or Markdown to share with your team." },
];

const tech = [
  { name: "React", g: "from-cyan-400 to-blue-500" },
  { name: "FastAPI", g: "from-emerald-400 to-teal-500" },
  { name: "Python", g: "from-yellow-300 to-amber-500" },
  { name: "Groq", g: "from-orange-400 to-red-500" },
  { name: "Whisper", g: "from-fuchsia-400 to-purple-500" },
  { name: "SQLite", g: "from-sky-400 to-indigo-500" },
  { name: "TailwindCSS", g: "from-teal-300 to-cyan-500" },
  { name: "TypeScript", g: "from-blue-400 to-indigo-500" },
];

const research = [
  { label: "WER", desc: "Word Error Rate on held-out set", note: "Generated after evaluation" },
  { label: "ROUGE", desc: "Summary quality vs references", note: "Generated after evaluation" },
  { label: "BERTScore", desc: "Semantic similarity of summaries", note: "Generated after evaluation" },
  { label: "Inference Time", desc: "Per minute of audio", note: "Generated after evaluation" },
  { label: "CPU Performance", desc: "Throughput on 4-core CPU", note: "Generated after evaluation" },
];

const faqs = [
  { q: "What audio formats are supported?", a: "MP3, WAV, FLAC, OGG and M4A up to 500MB per file. Larger files can be chunked." },
  { q: "Is my data private?", a: "Recordings are stored encrypted, processed in isolated jobs and deletable at any time." },
  { q: "How fast is processing?", a: "Faster-Whisper + Groq typically process a 10-minute clip in under 30 seconds on modern hardware." },
  { q: "Which languages work?", a: "Whisper supports 90+ languages. Summaries follow the source language or translate on request." },
  { q: "Is there an API?", a: "Yes — programmatic upload, transcription and summarization endpoints ship with every workspace." },
  { q: "How is pricing structured?", a: "A generous free tier for research, then usage-based pricing per minute processed." },
];

function LandingPage() {
  return (
    <div className="relative min-h-screen">
      <Backdrop />
      <Navbar />

      <Hero />
      <FeatureBento />
      <HowItWorks />

      {/* LIVE DEMO */}
      <section id="demo" className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeading eyebrow="Live demo" title="See the intelligence in action" subtitle="A realistic preview of how AudioInsight processes a weekly product sync." />
        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <Card className="glass border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">product-sync-w42.wav</div>
                <Badge variant="secondary" className="bg-white/10 text-xs">32:14</Badge>
              </div>
              <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-6">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <UploadCloud className="h-4 w-4" /> Drop audio here or click to upload
                </div>
                <div className="mt-6"><Waveform bars={56} /></div>
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground"><span>Transcribing</span><span>72%</span></div>
                  <Progress value={72} className="h-2" />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-white/5 p-3"><div className="font-semibold">Whisper</div><div className="text-muted-foreground">Small</div></div>
                <div className="rounded-lg bg-white/5 p-3"><div className="font-semibold">EN</div><div className="text-muted-foreground">Detected</div></div>
                <div className="rounded-lg bg-white/5 p-3"><div className="font-semibold">Groq</div><div className="text-muted-foreground">Llama-3.1</div></div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="glass border-white/10">
              <CardContent className="p-6">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><FileText className="h-4 w-4" /> Transcript</div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">Priya:</span> Alright, let's kick off. We shipped the streaming
                  endpoint on Monday and latency dropped by roughly 40 percent.
                  <span className="font-medium text-foreground"> Marco:</span> On the pricing page, conversion improved after
                  the copy tweak — should we hold and gather more data or roll it broadly?
                </p>
              </CardContent>
            </Card>
            <Card className="glass border-white/10">
              <CardContent className="p-6">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4" /> Summary</div>
                <p className="text-sm text-muted-foreground">
                  Streaming rollout is stable with a 40% latency win. Pricing copy A/B looks positive but the team wants a
                  larger sample before a broad rollout. Q4 roadmap review moves to Thursday.
                </p>
              </CardContent>
            </Card>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="glass border-white/10"><CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold"><ListChecks className="h-4 w-4" /> Action items</div>
                <ul className="space-y-1 text-xs text-muted-foreground"><li>• Marco: extend A/B one week</li><li>• Priya: publish latency notes</li><li>• Ana: draft Q4 doc</li></ul>
              </CardContent></Card>
              <Card className="glass border-white/10"><CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold"><Layers className="h-4 w-4" /> Topics</div>
                <div className="flex flex-wrap gap-1.5">{["Streaming","Pricing","Roadmap","Latency"].map(t => <Badge key={t} variant="secondary" className="bg-white/10 text-[10px]">{t}</Badge>)}</div>
              </CardContent></Card>
              <Card className="glass border-white/10"><CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold"><ClipboardCheck className="h-4 w-4" /> Decisions</div>
                <ul className="space-y-1 text-xs text-muted-foreground"><li>• Delay broad pricing rollout</li><li>• Ship streaming to all users</li></ul>
              </CardContent></Card>
            </div>
          </div>
        </div>
      </section>

      {/* TECH */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeading eyebrow="Stack" title="Built on the best of modern AI" />
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {tech.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="glass flex items-center justify-center gap-3 rounded-2xl p-6"
            >
              <span className={"h-8 w-8 rounded-lg bg-gradient-to-br " + t.g + " shadow-glow"} />
              <span className="text-sm font-medium">{t.name}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* RESEARCH */}
      <section id="research" className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeading eyebrow="Research" title="Evaluation-first by design" subtitle="Metrics slots ready for your test suite. Numbers appear after your evaluation run." />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {research.map((r) => (
            <motion.div key={r.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <Card className="glass border-white/10">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                    <LineIcon className="h-3.5 w-3.5" /> {r.label}
                  </div>
                  <div className="mt-3 text-2xl font-bold text-gradient">—</div>
                  <p className="mt-2 text-xs text-muted-foreground">{r.desc}</p>
                  <div className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground/70">{r.note}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SCREENSHOTS */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeading eyebrow="Product" title="A workspace built for your voice" />
        <div className="mt-12">
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="mx-auto flex w-fit border border-white/10 bg-white/5 backdrop-blur">
              {["dashboard","transcript","summary","evaluation","history"].map(t => (
                <TabsTrigger key={t} value={t} className="capitalize data-[state=active]:bg-gradient-brand data-[state=active]:text-white">{t}</TabsTrigger>
              ))}
            </TabsList>
            {[
              { v: "dashboard", label: "Overview", body: <MockDashboard /> },
              { v: "transcript", label: "Transcript", body: <MockTranscript /> },
              { v: "summary", label: "Summary", body: <MockSummary /> },
              { v: "evaluation", label: "Evaluation", body: <MockEvaluation /> },
              { v: "history", label: "History", body: <MockHistory /> },
            ].map(t => (
              <TabsContent key={t.v} value={t.v} className="mt-8">
                <LaptopMock label={"audioinsight.ai — " + t.label}>{t.body}</LaptopMock>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-6 py-24">
        <SectionHeading eyebrow="FAQ" title="Answers before you ask" />
        <div className="mt-10 glass rounded-2xl px-2 py-1">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={"i" + i} className="border-white/10 px-4">
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="glass-strong relative overflow-hidden rounded-3xl p-10 text-center shadow-glow">
          <div className="absolute inset-0 -z-10 opacity-60" style={{ background: "var(--gradient-radial)" }} />
          <ShieldCheck className="mx-auto h-8 w-8 text-white/90" />
          <h3 className="mt-4 text-3xl font-bold md:text-4xl">Stop taking notes. <span className="text-gradient">Start listening.</span></h3>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground md:text-base">Get accurate transcripts and structured summaries the moment your call ends.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button size="lg" className="bg-gradient-brand text-white shadow-glow" asChild><Link to="/signup">Create free account</Link></Button>
            <Button size="lg" variant="outline" className="border-white/15 bg-white/5" asChild><Link to="/dashboard">Explore dashboard</Link></Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

/* ---------------- Mock previews for screenshots section ---------------- */
function MockDashboard() {
  return (
    <div className="grid gap-3 p-4 md:grid-cols-4">
      {["Total Uploads","Summaries","Avg Time","Storage"].map((k, i) => (
        <div key={k} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</div>
          <div className="mt-1 text-lg font-bold">{["248","231","42s","3.2 GB"][i]}</div>
          <div className="mt-2 h-1.5 rounded-full bg-white/10"><div className="h-1.5 rounded-full bg-gradient-brand" style={{ width: [70,64,80,55][i] + "%" }} /></div>
        </div>
      ))}
      <div className="md:col-span-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-2 text-xs font-semibold">Activity</div>
        <div className="flex h-24 items-end gap-2">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="flex-1 rounded-t bg-gradient-brand opacity-80" style={{ height: 20 + ((i * 13) % 80) + "%" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
function MockTranscript() {
  return (
    <div className="grid gap-3 p-4 md:grid-cols-3">
      <div className="md:col-span-2 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm leading-relaxed">
        <p><span className="text-gradient font-semibold">00:12</span> Priya: The streaming release looked healthy through the weekend.</p>
        <p className="mt-2"><span className="text-gradient font-semibold">00:37</span> Marco: I'm inclined to hold the pricing copy for another week.</p>
        <p className="mt-2"><span className="text-gradient font-semibold">01:04</span> Ana: I'll pull the numbers and share Thursday.</p>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <div className="text-xs font-semibold">Search transcript</div>
        <div className="mt-2 h-8 rounded bg-white/5" />
        <div className="mt-4 text-xs text-muted-foreground">Words 1,204 · Speakers 3 · 32:14</div>
      </div>
    </div>
  );
}
function MockSummary() {
  return (
    <div className="grid gap-3 p-4 md:grid-cols-2">
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <div className="text-xs font-semibold">Short Summary</div>
        <p className="mt-2 text-sm text-muted-foreground">Streaming ships broadly; pricing A/B extends one week.</p>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <div className="text-xs font-semibold">Action Items</div>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          <li>• Marco — extend pricing A/B</li><li>• Priya — publish latency notes</li><li>• Ana — draft Q4 doc</li>
        </ul>
      </div>
    </div>
  );
}
function MockEvaluation() {
  return (
    <div className="grid grid-cols-5 gap-2 p-4">
      {["WER","ROUGE","BERT","Time","CPU"].map((m) => (
        <div key={m} className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-center">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{m}</div>
          <div className="mt-1 text-lg font-bold text-gradient">—</div>
        </div>
      ))}
      <div className="col-span-5 flex h-28 items-end gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] p-3">
        {Array.from({ length: 40 }).map((_, i) => <div key={i} className="flex-1 rounded-t bg-gradient-brand" style={{ height: 10 + ((i * 7) % 90) + "%" }} />)}
      </div>
    </div>
  );
}
function MockHistory() {
  return (
    <div className="p-4">
      <div className="rounded-lg border border-white/10 bg-white/[0.03]">
        {["team-sync.wav","interview-anna.mp3","lecture-cnn.m4a","podcast-ep41.mp3"].map((n, i) => (
          <div key={n} className={"flex items-center justify-between px-4 py-3 text-sm " + (i ? "border-t border-white/10" : "")}>
            <span className="flex items-center gap-2"><Waves className="h-4 w-4" /> {n}</span>
            <span className="text-xs text-muted-foreground">{["12:04","28:11","54:22","41:07"][i]}</span>
            <span className="text-xs text-muted-foreground">Ready</span>
          </div>
        ))}
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedCounter } from "@/components/site/AnimatedCounter";
import {
  AudioLines, Mic, Users, Braces, Tags, ListChecks, Quote, FileText, Workflow,
  ArrowRight, CheckCircle2, HelpCircle, BrainCircuit, Bot,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/research-models")({
  component: ResearchModelsPage,
  head: () => ({
    meta: [
      { title: "Research Models & Methodology — AudioInsight AI" },
      { name: "description", content: "The research paper's model pipeline and the models verified in the current application." },
      { property: "og:title", content: "Research Models & Methodology — AudioInsight AI" },
      { property: "og:description", content: "Whisper, pyannote, BERT, spaCy and BART components of the meeting-intelligence pipeline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const PIPELINE = [
  { label: "Audio Input", icon: AudioLines, detail: "Meetings, lectures, interviews" },
  { label: "Whisper Transcription", icon: Mic, detail: "Speech → text" },
  { label: "Speaker Diarization", icon: Users, detail: "Who said what" },
  { label: "NLP Analysis", icon: Braces, detail: "Entities, topics, actions" },
  { label: "BART Summarization", icon: FileText, detail: "Abstractive summary" },
  { label: "Structured Meeting Brief", icon: Workflow, detail: "Decisions · Actions · Deadlines · Owners" },
];

const COMPONENTS = [
  { purpose: "Audio transcription", model: "OpenAI Whisper large-v2", icon: Mic, what: "Converts meeting audio into raw text with word-level timestamps, robust to accents, overlap and noise." },
  { purpose: "Speaker diarization", model: "pyannote.audio", icon: Users, what: "Segments the audio by speaker so every utterance can be attributed to the right participant." },
  { purpose: "Semantic encoding", model: "BERT-Base", icon: BrainCircuit, what: "Produces sentence embeddings used for semantic similarity, clustering and retrieval across the transcript." },
  { purpose: "Named entity recognition", model: "spaCy en_core_web_trf", icon: Tags, what: "Extracts people, organisations, dates and other entities that populate the brief's owners and deadlines." },
  { purpose: "Topic classification", model: "BERT-based semantic representations", icon: Tags, what: "Clusters utterances and labels agenda topics from their BERT embeddings." },
  { purpose: "Action item detection", model: "Fine-tuned BERT (token classification + span extraction)", icon: ListChecks, what: "Identifies commitments, their owners and deadlines via token-level span extraction." },
  { purpose: "Punctuation restoration", model: "Lightweight BERT-based model", icon: Quote, what: "Restores punctuation and casing lost during speech recognition, making transcripts readable." },
  { purpose: "Meeting summarization", model: "Fine-tuned BART-Large-CNN", icon: FileText, what: "Generates abstractive summaries, fine-tuned toward meeting-style discourse." },
  { purpose: "Brief assembly", model: "Structured assembly layer (decisions, actions, deadlines, owners)", icon: Workflow, what: "Merges model outputs into the final structured meeting brief." },
];

const CURRENT_APP = [
  { purpose: "Audio transcription", model: "openai/gpt-4o-mini-transcribe (default) · openai/gpt-4o-transcribe (high accuracy)", verified: true, what: "Production transcription served through the Lovable AI Gateway; automatically retries with a compatible response format when a model rejects timestamped output." },
  { purpose: "Summarization & transcript chat", model: "google/gemini-3.6-flash", verified: true, what: "Generates structured summaries (executive, detailed, minutes, action items) and powers chat-with-transcript with grounded citations." },
  { purpose: "Local research evaluation (Whisper comparison)", model: "faster-whisper — base & small", verified: true, what: "Used by the Python reference harness in scripts/eval to benchmark transcription models on real datasets." },
  { purpose: "Evaluation metrics", model: "WER, CER, ROUGE-1/2/L (reference implementations)", verified: true, what: "Computed in-app from real transcripts and saved references; the Python harness additionally supports BERTScore." },
  { purpose: "Speaker diarization", model: "Not verified", verified: false, what: "No diarization service is wired into the current application pipeline." },
  { purpose: "Named entity recognition / BART summarizer", model: "Not verified", verified: false, what: "The paper's spaCy and BART components are not deployed in the running product." },
];

function ResearchModelsPage() {
  return (
    <PageShell
      title="Research Models & Methodology"
      description="The components behind the research paper's meeting-intelligence pipeline, and what the current application actually uses."
      actions={<Badge variant="outline" className="gap-1.5"><BrainCircuit className="h-3.5 w-3.5" /> Methodology</Badge>}
    >
      {/* ------------------------------- pipeline ------------------------------- */}
      <Card className="glass border-border/70">
        <CardContent className="p-6">
          <h2 className="text-base font-bold tracking-tight md:text-lg">Research pipeline</h2>
          <p className="mt-1 text-sm text-muted-foreground">End-to-end flow from raw audio to the structured meeting brief.</p>
          <ol className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-2">
            {PIPELINE.map((s, i) => (
              <li key={s.label} className="flex flex-1 items-center gap-2 lg:flex-col lg:items-start">
                <div className="flex w-full items-center gap-3 rounded-xl border border-border/70 bg-muted/50 p-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <s.icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold leading-tight text-foreground">
                      {i + 1}. {s.label}
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{s.detail}</div>
                  </div>
                </div>
                {i < PIPELINE.length - 1 && (
                  <>
                    <ArrowRight className="hidden h-4 w-4 shrink-0 rotate-90 text-muted-foreground/60 lg:block" aria-hidden />
                    <ArrowRight className="h-4 w-4 shrink-0 rotate-90 text-muted-foreground/60 lg:hidden" aria-hidden />
                  </>
                )}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* ------------------------------ components ------------------------------ */}
      <h2 className="mt-8 text-lg font-bold tracking-tight md:text-xl">Research paper components</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {COMPONENTS.map((c) => (
          <Card key={c.purpose} className="glass border-border/70 transition-shadow hover:shadow-glow">
            <CardContent className="p-5">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                  <c.icon className="h-4 w-4" aria-hidden />
                </span>
                <h3 className="text-sm font-semibold">{c.purpose}</h3>
              </div>
              <div className="mt-3 inline-flex items-center rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {c.model}
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">{c.what}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* --------------------------- current application --------------------------- */}
      <h2 className="mt-10 text-lg font-bold tracking-tight md:text-xl">Models used by the current application</h2>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
        Verified against the running codebase. Components without a wired implementation are labelled “Not verified” rather than claimed.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {CURRENT_APP.map((c) => (
          <Card key={c.purpose} className="glass border-border/70">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                    {c.verified ? <Bot className="h-4 w-4" aria-hidden /> : <HelpCircle className="h-4 w-4" aria-hidden />}
                  </span>
                  <h3 className="text-sm font-semibold">{c.purpose}</h3>
                </div>
                <Badge variant={c.verified ? "default" : "outline"} className="shrink-0 gap-1">
                  {c.verified ? <CheckCircle2 className="h-3 w-3" /> : null}
                  {c.verified ? "Verified" : "Not verified"}
                </Badge>
              </div>
              <div className={`mt-3 inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${c.verified ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                {c.model}
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">{c.what}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        The research prototype and the production application use different services by design: the production transcription and
        summarization services above are live and working, and are not replaced to match the paper.
      </p>
    </PageShell>
  );
}

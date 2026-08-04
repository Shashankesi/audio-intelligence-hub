import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { chatWithTranscript } from "@/lib/audio.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, MessageSquareText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What decisions were made?",
  "Who is responsible for what?",
  "List every deadline mentioned.",
  "Find every mention of budget.",
  "Generate the minutes of this meeting.",
];

/** Grounded Q&A over one transcript. History is kept in the session only. */
export function TranscriptChat({ recordingId }: { recordingId: string }) {
  const ask = useServerFn(chatWithTranscript);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const send = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    const history = messages.slice(-10);
    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");
    setBusy(true);
    try {
      const res = await ask({ data: { recordingId, question: q, history } });
      setMessages((m) => [...m, { role: "assistant", content: res.answer }]);
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Chat failed";
      toast.error(msg);
      setMessages((m) => [...m, { role: "assistant", content: `I couldn't answer that: ${msg}` }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="max-h-[46vh] flex-1 space-y-4 overflow-auto pr-1">
        {messages.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-sm text-muted-foreground">
            <MessageSquareText className="mb-2 h-5 w-5 text-fuchsia-300" />
            Ask anything about this meeting. Answers are grounded in the transcript and cite timestamps when available.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] text-sm leading-relaxed",
                m.role === "user"
                  ? "rounded-2xl rounded-br-md bg-gradient-brand px-4 py-2.5 text-white"
                  : "prose-summary text-foreground",
              )}
            >
              {m.role === "user" ? m.content : <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Reading the transcript…
          </div>
        )}
        <div ref={endRef} />
      </div>

      {messages.length === 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => void send(s)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-white/25 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        className="mt-4 flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(input);
            }
          }}
          placeholder="Ask about decisions, owners, deadlines…"
          aria-label="Ask about this meeting"
          className="min-h-[52px] resize-none bg-white/[0.03]"
        />
        <Button type="submit" disabled={busy || !input.trim()} size="icon" className="h-[52px] w-12 shrink-0 bg-gradient-brand text-white shadow-glow">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}

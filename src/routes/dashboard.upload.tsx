import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Waveform } from "@/components/site/Waveform";
import { UploadCloud, X, Check, FileAudio } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { useServerFn } from "@tanstack/react-start";
import { transcribeRecording, summarizeRecording } from "@/lib/audio.functions";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/dashboard/upload")({ component: UploadPage });

function UploadPage() {
  const { user } = useSession();
  const nav = useNavigate();
  const qc = useQueryClient();
  const transcribe = useServerFn(transcribeRecording);
  const summarize = useServerFn(summarizeRecording);

  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"idle" | "uploading" | "transcribing" | "summarizing" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file || !user || phase !== "idle") return;
    void run(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, user]);

  async function run(f: File) {
    if (!user) return;
    setErrorMsg(null);
    setPhase("uploading");
    setProgress(5);
    try {
      const ext = (f.name.split(".").pop() || "mp3").toLowerCase();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from("recordings").upload(path, f, {
        contentType: f.type || "audio/mpeg",
        upsert: false,
      });
      if (up.error) throw up.error;
      setProgress(35);

      const ins = await (supabase.from("recordings") as any).insert({
        user_id: user.id,
        name: f.name,
        storage_path: path,
        mime: f.type || "audio/mpeg",
        size_bytes: f.size,
        status: "uploaded",
        model: "openai/gpt-4o-mini-transcribe",
      }).select("id").single();
      if (ins.error) throw ins.error;
      const recordingId = ins.data.id as string;

      setPhase("transcribing");
      setProgress(55);
      await transcribe({ data: { recordingId } });
      setProgress(80);

      setPhase("summarizing");
      await summarize({ data: { recordingId } });
      setProgress(100);
      setPhase("done");
      qc.invalidateQueries();
      toast.success("All done — opening summary.");
      setTimeout(() => nav({ to: "/dashboard/summary", search: { id: recordingId } as any }), 700);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrorMsg(msg);
      setPhase("error");
      toast.error(msg);
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) { setPhase("idle"); setProgress(0); setFile(f); }
  };

  const label =
    phase === "uploading" ? "Uploading audio…" :
    phase === "transcribing" ? "Transcribing with Whisper…" :
    phase === "summarizing" ? "Generating AI summary…" :
    phase === "done" ? "Complete" :
    phase === "error" ? "Failed" : "Waiting";

  return (
    <PageShell title="Upload audio" description="Drop a file or browse. We'll transcribe and summarize automatically.">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="glass border-white/10 lg:col-span-2">
          <CardContent className="p-6">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className="cursor-pointer rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] p-10 text-center transition hover:border-white/30 hover:bg-white/[0.04]"
            >
              <input ref={inputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setPhase("idle"); setProgress(0); setFile(f); } }} />
              <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm">Drag & drop or <span className="text-gradient font-semibold">click to browse</span></p>
              <p className="mt-1 text-xs text-muted-foreground">MP3, WAV, M4A, FLAC — up to 25 MB per file</p>
            </div>

            <AnimatePresence>
              {file && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-brand shadow-glow"><FileAudio className="h-5 w-5 text-white" /></span>
                      <div>
                        <div className="text-sm font-medium">{file.name}</div>
                        <div className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB · audio</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => { setFile(null); setPhase("idle"); setProgress(0); }}><X className="h-4 w-4" /></Button>
                  </div>
                  <div className="mt-4"><Waveform bars={64} /></div>
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground"><span>{label}</span><span>{progress}%</span></div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  {phase === "done" && (
                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="mt-4 flex items-center gap-2 text-sm text-emerald-300">
                      <Check className="h-4 w-4" /> Done — opening summary.
                    </motion.div>
                  )}
                  {phase === "error" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                      {errorMsg}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <Card className="glass border-white/10">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold">Supported formats</h3>
            <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
              {["MP3","WAV","FLAC","OGG","M4A"].map(f => <li key={f} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-center">{f}</li>)}
            </ul>
            <h3 className="mt-6 text-sm font-semibold">Tips</h3>
            <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
              <li>• Cleaner audio → better transcripts.</li>
              <li>• Mono at 16kHz is optimal for Whisper.</li>
              <li>• Keep clips under 25 MB for now.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

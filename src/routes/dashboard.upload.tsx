import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Waveform } from "@/components/site/Waveform";
import { UploadCloud, X, Check, FileAudio } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/dashboard/upload")({ component: UploadPage });

function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file || done) return;
    setProgress(0);
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(id); setDone(true); toast.success("Upload complete!"); return 100; }
        return p + 4;
      });
    }, 120);
    return () => clearInterval(id);
  }, [file, done]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) { setDone(false); setFile(f); }
  };

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
              <input ref={inputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setDone(false); setFile(f); } }} />
              <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm">Drag & drop or <span className="text-gradient font-semibold">click to browse</span></p>
              <p className="mt-1 text-xs text-muted-foreground">Supports MP3, WAV, FLAC, OGG, M4A — up to 500MB</p>
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
                    <Button variant="ghost" size="icon" onClick={() => { setFile(null); setDone(false); setProgress(0); }}><X className="h-4 w-4" /></Button>
                  </div>
                  <div className="mt-4"><Waveform bars={64} /></div>
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground"><span>{done ? "Complete" : "Uploading & transcribing"}</span><span>{progress}%</span></div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  {done && (
                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="mt-4 flex items-center gap-2 text-sm text-emerald-300">
                      <Check className="h-4 w-4" /> Done — summary is being generated.
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
              <li>• Long files are chunked automatically.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

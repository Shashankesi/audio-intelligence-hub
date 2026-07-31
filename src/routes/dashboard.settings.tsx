import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { Sparkles, Sliders, ShieldCheck, Loader2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Settings — AudioInsight AI" },
      { name: "description", content: "Choose your default transcription model, language and workspace preferences for AudioInsight AI." },
      { property: "og:title", content: "Settings — AudioInsight AI" },
      { property: "og:description", content: "Tune transcription defaults and workspace preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const PREF_KEY = "ai:prefs";
type Prefs = { notifyDone: boolean; weekly: boolean; autoSummarize: boolean; compactTables: boolean };
const DEFAULT_PREFS: Prefs = { notifyDone: true, weekly: false, autoSummarize: true, compactTables: false };

const MODELS = [
  { id: "openai/gpt-4o-mini-transcribe", label: "Fast — gpt-4o-mini-transcribe", hint: "Best cost/speed for long meetings" },
  { id: "openai/gpt-4o-transcribe", label: "Accurate — gpt-4o-transcribe", hint: "Highest accuracy, slower" },
];
const LANGS = [
  ["auto", "Auto-detect"], ["en", "English"], ["es", "Spanish"], ["fr", "French"],
  ["de", "German"], ["hi", "Hindi"], ["pt", "Portuguese"], ["ja", "Japanese"],
] as const;

function SettingsPage() {
  const { user } = useSession();
  const qc = useQueryClient();
  const [model, setModel] = useState(MODELS[0].id);
  const [lang, setLang] = useState("auto");
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await (supabase.from("profiles") as any).select("*").eq("id", user!.id).maybeSingle()).data,
  });

  useEffect(() => {
    if (profile) {
      setModel(profile.default_model || MODELS[0].id);
      setLang(profile.default_language || "auto");
    }
  }, [profile?.default_model, profile?.default_language]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREF_KEY);
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
    } catch { /* ignore */ }
  }, []);

  const setPref = (k: keyof Prefs, v: boolean) => {
    const next = { ...prefs, [k]: v };
    setPrefs(next);
    localStorage.setItem(PREF_KEY, JSON.stringify(next));
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const r = await (supabase.from("profiles") as any)
      .update({ default_model: model, default_language: lang })
      .eq("id", user.id);
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
    setSaving(false);
    if (r.error) return toast.error(r.error.message);
    qc.invalidateQueries({ queryKey: ["profile", user.id] });
    toast.success("Settings saved — new uploads will use these defaults.");
  };

  return (
    <PageShell
      title="Settings"
      description="Defaults applied to every new upload, plus workspace preferences."
      actions={
        <Button disabled={saving} className="bg-gradient-brand text-white shadow-glow" onClick={save}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Save changes
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass border-white/10">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-gradient-brand p-2 text-white"><Sparkles className="h-4 w-4" /></span>
              <div>
                <h3 className="text-sm font-semibold">Transcription defaults</h3>
                <p className="text-xs text-muted-foreground">Managed for you — no API keys required.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Speech-to-text model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="bg-white/5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">{MODELS.find((m) => m.id === model)?.hint}</p>
            </div>

            <div className="space-y-2">
              <Label>Spoken language</Label>
              <Select value={lang} onValueChange={setLang}>
                <SelectTrigger className="bg-white/5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">Auto-detect works well for most meetings.</p>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-[11px] text-muted-foreground">
              <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
              Transcription and summarization run on our managed AI backend. Your audio never leaves your workspace.
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/10">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-white/10 p-2"><Sliders className="h-4 w-4" /></span>
              <div>
                <h3 className="text-sm font-semibold">Workspace preferences</h3>
                <p className="text-xs text-muted-foreground">Saved instantly on this device.</p>
              </div>
            </div>
            {([
              ["autoSummarize", "Summarize automatically after transcription"],
              ["notifyDone", "Show a toast when a job completes"],
              ["weekly", "Weekly usage summary"],
              ["compactTables", "Compact table density"],
            ] as [keyof Prefs, string][]).map(([k, l]) => (
              <div key={k} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
                <span className="text-sm">{l}</span>
                <Switch checked={prefs[k]} onCheckedChange={(v) => setPref(k, v)} />
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="border-white/15 bg-white/5"
                onClick={() => { setPrefs(DEFAULT_PREFS); localStorage.setItem(PREF_KEY, JSON.stringify(DEFAULT_PREFS)); toast.success("Preferences reset"); }}
              >
                Reset to defaults
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

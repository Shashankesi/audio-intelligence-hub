import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/** Must match CHUNK_SEC in src/lib/audio-encode.ts — used to offset chunk timestamps. */
const CHUNK_SEC = 480;

const str = { type: "string" } as const;
const strArr = { type: "array", items: { type: "string" } } as const;
const obj = (props: Record<string, unknown>) => ({
  type: "object",
  additionalProperties: false,
  required: Object.keys(props),
  properties: props,
});
const objArr = (props: Record<string, unknown>) => ({ type: "array", items: obj(props) });
const nullable = { type: ["string", "null"] } as const;

const SUMMARY_JSON_SCHEMA = obj({
  short_text: str,
  detailed_text: str,
  meeting_minutes: str,
  bullet_points: strArr,
  key_points: strArr,
  topics: strArr,
  keywords: strArr,
  suggestions: strArr,
  confidence: { type: "number" },
  action_items: objArr({
    text: str,
    owner: nullable,
    deadline: nullable,
    priority: { type: "string", enum: ["high", "medium", "low"] },
    status: { type: "string", enum: ["open", "in_progress", "done"] },
  }),
  decisions: objArr({ text: str, rationale: str }),
  risks: objArr({ text: str, severity: { type: "string", enum: ["high", "medium", "low"] } }),
  deadlines: objArr({ label: str, date: nullable, owner: nullable }),
  quotes: objArr({ text: str, speaker: nullable, time: nullable }),
  timeline: objArr({ time: str, title: str, detail: str }),
  sentiment: obj({
    label: { type: "string", enum: ["positive", "neutral", "negative", "mixed"] },
    score: { type: "number" },
    rationale: str,
  }),
});

const SummarySchema = z.object({
  short_text: z.string(),
  detailed_text: z.string(),
  meeting_minutes: z.string(),
  bullet_points: z.array(z.string()),
  key_points: z.array(z.string()),
  topics: z.array(z.string()),
  keywords: z.array(z.string()),
  suggestions: z.array(z.string()),
  confidence: z.number(),
  action_items: z.array(
    z.object({
      text: z.string(),
      owner: z.string().nullable(),
      deadline: z.string().nullable(),
      priority: z.enum(["high", "medium", "low"]),
      status: z.enum(["open", "in_progress", "done"]),
    }),
  ),
  decisions: z.array(z.object({ text: z.string(), rationale: z.string() })),
  risks: z.array(z.object({ text: z.string(), severity: z.enum(["high", "medium", "low"]) })),
  deadlines: z.array(z.object({ label: z.string(), date: z.string().nullable(), owner: z.string().nullable() })),
  quotes: z.array(z.object({ text: z.string(), speaker: z.string().nullable(), time: z.string().nullable() })),
  timeline: z.array(z.object({ time: z.string(), title: z.string(), detail: z.string() })),
  sentiment: z.object({
    label: z.enum(["positive", "neutral", "negative", "mixed"]),
    score: z.number(),
    rationale: z.string(),
  }),
});

const SUMMARY_MODEL = "google/gemini-3.6-flash";
const CHAT_MODEL = "google/gemini-3.6-flash";

const clock = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

export const transcribeRecording = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ recordingId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { transcribeAudio } = await import("./ai-gateway.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rec, error: recErr } = await context.supabase
      .from("recordings")
      .select("*")
      .eq("id", data.recordingId)
      .single();
    if (recErr || !rec) throw new Error("Recording not found");

    await context.supabase.from("recordings").update({ status: "transcribing" }).eq("id", rec.id);

    const started = Date.now();
    try {
      const model = rec.model || "openai/gpt-4o-mini-transcribe";

      // A recording is either a single object (path has an extension) or a
      // folder of ordered chunks written by the browser for long meetings.
      let paths: string[] = [rec.storage_path];
      if (!/\.[a-z0-9]{2,5}$/i.test(rec.storage_path)) {
        const listed = await supabaseAdmin.storage.from("recordings").list(rec.storage_path, {
          limit: 200,
          sortBy: { column: "name", order: "asc" },
        });
        if (listed.error) throw new Error(`Storage list failed: ${listed.error.message}`);
        paths = (listed.data ?? [])
          .filter((o) => o.name && !o.name.startsWith("."))
          .map((o) => `${rec.storage_path}/${o.name}`)
          .sort();
        if (paths.length === 0) throw new Error("No audio parts found for this recording");
      }

      const parts: string[] = [];
      const segments: { start: number; end: number; text: string }[] = [];
      for (let i = 0; i < paths.length; i++) {
        const p = paths[i];
        const dl = await supabaseAdmin.storage.from("recordings").download(p);
        if (dl.error || !dl.data) throw new Error(`Storage download failed: ${dl.error?.message}`);
        const bytes = await dl.data.arrayBuffer();
        const res = await transcribeAudio({
          bytes,
          mime: p.endsWith(".wav") ? "audio/wav" : rec.mime || "audio/mpeg",
          filename: p.split("/").pop() || "recording.mp3",
          model,
          language: rec.language ?? undefined,
        });
        if (res.text.trim()) parts.push(res.text.trim());
        const offset = paths.length > 1 ? i * CHUNK_SEC : 0;
        for (const s of res.segments) {
          segments.push({ start: s.start + offset, end: s.end + offset, text: s.text });
        }
      }
      const text = parts.join("\n\n");
      if (!text.trim()) throw new Error("No speech detected in this recording");

      const latency = Date.now() - started;

      const { error: upErr } = await context.supabase.from("transcripts").upsert({
        recording_id: rec.id,
        user_id: context.userId,
        text,
        segments: segments.length ? segments : null,
        model,
        latency_ms: latency,
      });
      if (upErr) throw upErr;

      await context.supabase
        .from("recordings")
        .update({ status: "transcribed", error: null })
        .eq("id", rec.id);

      return { text, latency_ms: latency, segments: segments.length };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await context.supabase.from("recordings").update({ status: "failed", error: msg }).eq("id", rec.id);
      throw e;
    }
  });

export const summarizeRecording = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ recordingId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { generateJson } = await import("./ai-gateway.server");

    const { data: t, error: tErr } = await context.supabase
      .from("transcripts")
      .select("text, segments, recording_id")
      .eq("recording_id", data.recordingId)
      .single();
    if (tErr || !t) throw new Error("Transcript not ready");
    if (!t.text || t.text.trim().length < 5) throw new Error("Transcript is empty");

    await context.supabase.from("recordings").update({ status: "summarizing" }).eq("id", data.recordingId);

    const segs = (t.segments as { start: number; end: number; text: string }[] | null) ?? [];
    const body = segs.length
      ? segs.map((s) => `[${clock(s.start)}] ${s.text}`).join("\n").slice(0, 180_000)
      : t.text.slice(0, 180_000);

    const prompt = `You are a senior meeting analyst producing an executive-grade meeting intelligence report. Read the ENTIRE transcript and return JSON. Never invent facts; when something is uncertain, say so explicitly instead of guessing.

${segs.length ? "Each line is prefixed with its [MM:SS] timestamp — use these real timestamps for timeline entries and quotes." : "No timestamps are available — use \"--:--\" for timeline and quote times."}

Field rules:
- short_text: crisp 3-4 sentence executive summary: what this was about, what was decided, what happens next.
- detailed_text: THOROUGH Markdown write-up, 400-900 words, with these headings: ## Overview, ## Discussion by Topic (### per topic, 2-5 sentences each with names, numbers, dates, tools, arguments on each side), ## Decisions Made, ## Risks, Blockers & Open Questions, ## Next Steps. Preserve figures, deadlines and named entities exactly.
- meeting_minutes: formal Minutes of Meeting in Markdown: **Date/Time**, **Attendees** (names heard in the transcript, else "Not stated"), **Agenda**, numbered **Discussion** points, **Decisions**, **Action Items** table (Owner | Task | Deadline), **Next Meeting**.
- bullet_points: 8-12 very short skimmable bullets (max ~12 words each).
- key_points: 6-10 information-dense self-contained bullets including the actual fact or outcome.
- action_items: every concrete commitment. text = imperative task; owner = person's name or null; deadline = date/relative deadline as spoken or null; priority high|medium|low; status open unless explicitly finished.
- decisions: each decision with the reasoning behind it.
- risks: risks, blockers and concerns with severity.
- deadlines: dated commitments (label, date as spoken or null, owner or null).
- quotes: 3-6 verbatim important quotes with speaker (or null) and time.
- timeline: 5-12 chronological beats, time as MM:SS, short title (2-5 words) and one-sentence detail.
- topics: 4-8 short tag topics. keywords: 8-15 domain keywords/entities.
- suggestions: 3-5 concrete AI recommendations for the team's follow-up.
- sentiment: label positive|neutral|negative|mixed, score in [-1,1], one-sentence rationale.
- confidence: 0-1 — your confidence in this analysis given transcript quality and completeness.

Return empty arrays only when the transcript genuinely has nothing for that field.

TRANSCRIPT:
"""${body}"""`;

    try {
      const raw = await generateJson<unknown>({
        model: SUMMARY_MODEL,
        prompt,
        schemaName: "meeting_intelligence",
        schema: SUMMARY_JSON_SCHEMA as unknown as Record<string, unknown>,
      });
      const output = SummarySchema.parse(raw);

      const { error: sErr } = await context.supabase.from("summaries").upsert({
        recording_id: data.recordingId,
        user_id: context.userId,
        short_text: output.short_text,
        detailed_text: output.detailed_text,
        meeting_minutes: output.meeting_minutes,
        bullet_points: output.bullet_points,
        key_points: output.key_points,
        action_items: output.action_items,
        decisions: output.decisions,
        risks: output.risks,
        deadlines: output.deadlines,
        quotes: output.quotes,
        timeline: output.timeline,
        topics: output.topics,
        keywords: output.keywords,
        suggestions: output.suggestions,
        confidence: output.confidence,
        sentiment: output.sentiment,
        model: SUMMARY_MODEL,
      });
      if (sErr) throw sErr;

      await context.supabase
        .from("recordings")
        .update({ status: "done", error: null })
        .eq("id", data.recordingId);

      return output;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await context.supabase.from("recordings").update({ status: "failed", error: msg }).eq("id", data.recordingId);
      throw e;
    }
  });

/** Grounded Q&A over a single transcript. */
export const chatWithTranscript = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        recordingId: z.string().uuid(),
        question: z.string().trim().min(1).max(2000),
        history: z
          .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(8000) }))
          .max(20)
          .default([]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { generateChat } = await import("./ai-gateway.server");
    const { data: t, error } = await context.supabase
      .from("transcripts")
      .select("text, segments")
      .eq("recording_id", data.recordingId)
      .single();
    if (error || !t?.text) throw new Error("Transcript not ready");

    const segs = (t.segments as { start: number; text: string }[] | null) ?? [];
    const body = segs.length
      ? segs.map((s) => `[${clock(s.start)}] ${s.text}`).join("\n").slice(0, 180_000)
      : t.text.slice(0, 180_000);

    const answer = await generateChat({
      model: CHAT_MODEL,
      messages: [
        {
          role: "system",
          content: `You answer questions about ONE meeting transcript. Ground every claim in the transcript, quote short phrases, and cite [MM:SS] timestamps when available. If the transcript does not contain the answer, say so plainly instead of guessing. Answer in concise Markdown.\n\nTRANSCRIPT:\n"""${body}"""`,
        },
        ...data.history,
        { role: "user", content: data.question },
      ],
    });
    return { answer };
  });

export const deleteRecording = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ recordingId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: rec } = await context.supabase
      .from("recordings")
      .select("storage_path")
      .eq("id", data.recordingId)
      .single();
    if (rec?.storage_path) {
      if (/\.[a-z0-9]{2,5}$/i.test(rec.storage_path)) {
        await context.supabase.storage.from("recordings").remove([rec.storage_path]);
      } else {
        const listed = await context.supabase.storage.from("recordings").list(rec.storage_path, { limit: 200 });
        const paths = (listed.data ?? []).map((o) => `${rec.storage_path}/${o.name}`);
        if (paths.length) await context.supabase.storage.from("recordings").remove(paths);
      }
    }
    const { error } = await context.supabase.from("recordings").delete().eq("id", data.recordingId);
    if (error) throw error;
    return { ok: true };
  });

export const updateTranscript = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ recordingId: z.string().uuid(), text: z.string() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("transcripts")
      .update({ text: data.text })
      .eq("recording_id", data.recordingId);
    if (error) throw error;
    return { ok: true };
  });

export const updateActionItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        recordingId: z.string().uuid(),
        items: z
          .array(
            z.object({
              text: z.string().max(600),
              owner: z.string().max(120).nullable(),
              deadline: z.string().max(120).nullable(),
              priority: z.enum(["high", "medium", "low"]),
              status: z.enum(["open", "in_progress", "done"]),
            }),
          )
          .max(200),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("summaries")
      .update({ action_items: data.items })
      .eq("recording_id", data.recordingId);
    if (error) throw error;
    return { ok: true };
  });

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const SummarySchema = z.object({
  short_text: z.string(),
  detailed_text: z.string(),
  key_points: z.array(z.string()),
  action_items: z.array(z.object({ text: z.string(), owner: z.string().nullable() })),
  topics: z.array(z.string()),
  sentiment: z.object({
    label: z.enum(["positive", "neutral", "negative", "mixed"]),
    score: z.number(),
    rationale: z.string(),
  }),
});

const SUMMARY_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["short_text", "detailed_text", "key_points", "action_items", "topics", "sentiment"],
  properties: {
    short_text: { type: "string" },
    detailed_text: { type: "string" },
    key_points: { type: "array", items: { type: "string" } },
    action_items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "owner"],
        properties: { text: { type: "string" }, owner: { type: ["string", "null"] } },
      },
    },
    topics: { type: "array", items: { type: "string" } },
    sentiment: {
      type: "object",
      additionalProperties: false,
      required: ["label", "score", "rationale"],
      properties: {
        label: { type: "string", enum: ["positive", "neutral", "negative", "mixed"] },
        score: { type: "number" },
        rationale: { type: "string" },
      },
    },
  },
} as const;

const SUMMARY_MODEL = "google/gemini-3.6-flash";

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

    await context.supabase
      .from("recordings")
      .update({ status: "transcribing" })
      .eq("id", rec.id);

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
      for (const p of paths) {
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
      }
      const text = parts.join("\n\n");
      if (!text.trim()) throw new Error("No speech detected in this recording");

      const latency = Date.now() - started;

      const { error: upErr } = await context.supabase.from("transcripts").upsert({
        recording_id: rec.id,
        user_id: context.userId,
        text,
        model,
        latency_ms: latency,
      });
      if (upErr) throw upErr;

      await context.supabase
        .from("recordings")
        .update({ status: "transcribed", error: null })
        .eq("id", rec.id);

      return { text, latency_ms: latency };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await context.supabase
        .from("recordings")
        .update({ status: "failed", error: msg })
        .eq("id", rec.id);
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
      .select("text, recording_id")
      .eq("recording_id", data.recordingId)
      .single();
    if (tErr || !t) throw new Error("Transcript not ready");
    if (!t.text || t.text.trim().length < 5) throw new Error("Transcript is empty");

    await context.supabase
      .from("recordings")
      .update({ status: "summarizing" })
      .eq("id", data.recordingId);

    const prompt = `You are a senior meeting analyst. Read the ENTIRE transcript below and produce a rich, faithful, structured analysis as JSON. Never invent facts that are not supported by the transcript; if something is unclear, say so explicitly.

Field rules:
- short_text: a crisp executive summary of 3-4 sentences answering: what was this about, what was decided, what happens next.
- detailed_text: a THOROUGH multi-section write-up in Markdown, 400-900 words, using exactly these headings (omit a section only if the transcript truly has nothing for it):
  ## Overview
  ## Discussion by Topic
  (a "### <topic>" subsection per major topic, each 2-5 sentences with concrete details: names, numbers, dates, tools, arguments raised on each side)
  ## Decisions Made
  (bulleted, each with the reasoning behind it)
  ## Risks, Blockers & Open Questions
  ## Next Steps
  Write in clear, neutral prose. Quote short phrases from the transcript when a wording matters. Preserve all figures, deadlines and named entities exactly as spoken.
- key_points: 6-10 self-contained, information-dense bullets (not vague headlines — include the actual fact or outcome).
- action_items: every concrete commitment or task. text = imperative task including any deadline mentioned; owner = the person's name if identifiable, else null. Return an empty array only when there genuinely are none.
- topics: 4-8 short tag-style topics (1-3 words each).
- sentiment: label one of positive|neutral|negative|mixed; score in [-1,1]; rationale = one sentence citing what drove the tone.

If the transcript is short or partly unintelligible, still fill every field, and note the limitation inside detailed_text.

TRANSCRIPT:
"""${t.text.slice(0, 180_000)}"""`;

    try {
      const raw = await generateJson<unknown>({
        model: SUMMARY_MODEL,
        prompt,
        schemaName: "meeting_summary",
        schema: SUMMARY_JSON_SCHEMA as unknown as Record<string, unknown>,
      });
      const output = SummarySchema.parse(raw);

      const { error: sErr } = await context.supabase.from("summaries").upsert({
        recording_id: data.recordingId,
        user_id: context.userId,
        short_text: output.short_text,
        detailed_text: output.detailed_text,
        key_points: output.key_points,
        action_items: output.action_items,
        topics: output.topics,
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
      await context.supabase
        .from("recordings")
        .update({ status: "failed", error: msg })
        .eq("id", data.recordingId);
      throw e;
    }
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
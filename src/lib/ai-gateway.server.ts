import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function createLovableAiGatewayProvider(lovableApiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
}

export type TranscriptSegment = { start: number; end: number; text: string };

export async function transcribeAudio(params: {
  bytes: ArrayBuffer;
  mime: string;
  filename: string;
  model?: string;
  language?: string;
}): Promise<{ text: string; segments: TranscriptSegment[] }> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY missing");

  const post = async (responseFormat: "verbose_json" | "json") => {
    const form = new FormData();
    form.append("model", params.model || "openai/gpt-4o-mini-transcribe");
    if (params.language && params.language !== "auto") form.append("language", params.language);
    form.append("response_format", responseFormat);
    form.append("file", new Blob([params.bytes], { type: params.mime || "audio/mpeg" }), params.filename);
    return fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });
  };

  // Not every transcription model supports verbose_json (timestamps); fall back to plain json.
  let res = await post("verbose_json");
  if (res.status === 400) {
    const body = await res.text().catch(() => "");
    if (/verbose_json|response_format/i.test(body)) {
      res = await post("json");
    } else {
      const err = new Error(`Transcription failed [400] ${body}`) as Error & { status?: number };
      err.status = 400;
      throw err;
    }
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new Error(`Transcription failed [${res.status}] ${body}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  const raw = await res.text();
  let data: { text?: string; segments?: { start?: number; end?: number; text?: string }[] } = {};
  try {
    data = JSON.parse(raw) as typeof data;
  } catch {
    return { text: raw, segments: [] };
  }
  const segments = (data.segments ?? [])
    .filter((s) => typeof s.text === "string" && s.text.trim())
    .map((s) => ({ start: Number(s.start ?? 0), end: Number(s.end ?? 0), text: (s.text ?? "").trim() }));
  return { text: data.text ?? segments.map((s) => s.text).join(" "), segments };
}

/**
 * Structured JSON completion through the gateway. Uses the OpenAI-compatible
 * `json_schema` response format and tolerates models that wrap output in
 * markdown fences.
 */

/** Plain chat completion through the gateway. */
export async function generateChat(params: {
  model: string;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
}): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY missing");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: params.model, messages: params.messages }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("AI rate limit reached — please retry in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
    throw new Error(`AI request failed [${res.status}] ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content ?? "";
}

export async function generateJson<T>(params: {
  model: string;
  prompt: string;
  schemaName: string;
  schema: Record<string, unknown>;
}): Promise<T> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY missing");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: params.model,
      messages: [{ role: "user", content: params.prompt }],
      response_format: {
        type: "json_schema",
        json_schema: { name: params.schemaName, strict: true, schema: params.schema },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("AI rate limit reached — please retry in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
    throw new Error(`Summary failed [${res.status}] ${body.slice(0, 300)}`);
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = json.choices?.[0]?.message?.content ?? "";
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1)) as T;
    throw new Error("The model returned an unreadable summary. Please try again.");
  }
}
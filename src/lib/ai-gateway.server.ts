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

export async function transcribeAudio(params: {
  bytes: ArrayBuffer;
  mime: string;
  filename: string;
  model?: string;
  language?: string;
}): Promise<{ text: string }> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY missing");

  const form = new FormData();
  form.append("model", params.model || "openai/gpt-4o-mini-transcribe");
  if (params.language && params.language !== "auto") form.append("language", params.language);
  form.append("file", new Blob([params.bytes], { type: params.mime || "audio/mpeg" }), params.filename);

  const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new Error(`Transcription failed [${res.status}] ${body}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  const data = (await res.json()) as { text?: string };
  return { text: data.text ?? "" };
}

/**
 * Structured JSON completion through the gateway. Uses the OpenAI-compatible
 * `json_schema` response format and tolerates models that wrap output in
 * markdown fences.
 */
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
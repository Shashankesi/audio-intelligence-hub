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
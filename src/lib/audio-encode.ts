// Client-side audio helpers: decode any browser-supported audio, downsample to
// 16 kHz mono, and encode a standard 16-bit PCM WAV. Keeps uploads well under
// the Lovable AI Gateway's 25 MiB transcription cap for typical recordings.

const TARGET_SR = 16000;
const GATEWAY_MAX_BYTES = 24 * 1024 * 1024; // stay a hair under 25 MiB

export const MAX_UPLOAD_BYTES = GATEWAY_MAX_BYTES;

export async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  const arrayBuf = await file.arrayBuffer();
  const AC: typeof AudioContext =
    (window.AudioContext as typeof AudioContext) ||
    ((window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
  const ctx = new AC();
  try {
    return await ctx.decodeAudioData(arrayBuf.slice(0));
  } finally {
    void ctx.close();
  }
}

function downmixToMono(buf: AudioBuffer): Float32Array {
  if (buf.numberOfChannels === 1) return buf.getChannelData(0);
  const len = buf.length;
  const out = new Float32Array(len);
  for (let ch = 0; ch < buf.numberOfChannels; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) out[i] += data[i];
  }
  const g = 1 / buf.numberOfChannels;
  for (let i = 0; i < len; i++) out[i] *= g;
  return out;
}

function resampleLinear(input: Float32Array, fromSR: number, toSR: number): Float32Array {
  if (fromSR === toSR) return input;
  const ratio = fromSR / toSR;
  const outLen = Math.floor(input.length / ratio);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const src = i * ratio;
    const i0 = Math.floor(src);
    const i1 = Math.min(i0 + 1, input.length - 1);
    const t = src - i0;
    out[i] = input[i0] * (1 - t) + input[i1] * t;
  }
  return out;
}

function encodeWav16(pcm: Float32Array, sampleRate: number): Blob {
  const bytesPerSample = 2;
  const buffer = new ArrayBuffer(44 + pcm.length * bytesPerSample);
  const view = new DataView(buffer);
  const writeStr = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + pcm.length * bytesPerSample, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, pcm.length * bytesPerSample, true);
  let o = 44;
  for (let i = 0; i < pcm.length; i++, o += 2) {
    const s = Math.max(-1, Math.min(1, pcm[i]));
    view.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

export type PreparedAudio = {
  file: File;
  durationSec: number;
  transcoded: boolean;
};

/**
 * Ensure the audio is small enough for the Gateway. If the raw file already
 * fits, upload as-is. Otherwise decode → mono → 16 kHz → WAV. Throws a
 * friendly Error if the result would still exceed the Gateway cap.
 */
export async function prepareAudioForUpload(file: File): Promise<PreparedAudio> {
  if (file.size <= GATEWAY_MAX_BYTES) {
    return { file, durationSec: 0, transcoded: false };
  }

  let buf: AudioBuffer;
  try {
    buf = await decodeAudioFile(file);
  } catch {
    throw new Error(
      "This file is over 24 MB and the browser couldn't decode it to shrink it. " +
        "Please upload a shorter clip or export a smaller MP3/WAV.",
    );
  }

  const mono = downmixToMono(buf);
  const pcm = resampleLinear(mono, buf.sampleRate, TARGET_SR);
  const wav = encodeWav16(pcm, TARGET_SR);

  if (wav.size > GATEWAY_MAX_BYTES) {
    const minutes = Math.round(buf.duration / 60);
    throw new Error(
      `Recording is ~${minutes} min long. Please split it into clips under ~25 minutes ` +
        `each so it fits the transcription limit.`,
    );
  }

  const base = file.name.replace(/\.[^.]+$/, "");
  return {
    file: new File([wav], `${base}.wav`, { type: "audio/wav" }),
    durationSec: buf.duration,
    transcoded: true,
  };
}
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

/** Chunk length in seconds. 8 min of 16 kHz mono 16-bit WAV ≈ 15 MB. */
const CHUNK_SEC = 480;
/** Hard ceiling on recording length. */
export const MAX_DURATION_SEC = 60 * 60 + 120; // 1 hour (+2 min grace)

export type PreparedAudio = {
  /** One or more chunk files, in playback order. */
  files: File[];
  durationSec: number;
  transcoded: boolean;
};

/**
 * Prepare audio for upload + transcription. Small short files upload as-is.
 * Anything larger is decoded → mono → 16 kHz → split into ~8 minute WAV
 * chunks, so recordings up to a full hour go through the Gateway's per-request
 * size cap. Throws a friendly Error past the one-hour ceiling.
 */
export async function prepareAudioForUpload(file: File): Promise<PreparedAudio> {
  let buf: AudioBuffer | null = null;
  try {
    buf = await decodeAudioFile(file);
  } catch {
    buf = null;
  }

  if (!buf) {
    if (file.size <= GATEWAY_MAX_BYTES) return { files: [file], durationSec: 0, transcoded: false };
    throw new Error(
      "This file is over 24 MB and the browser couldn't decode it to shrink it. " +
        "Please re-export it as MP3 or WAV and try again.",
    );
  }

  if (buf.duration > MAX_DURATION_SEC) {
    const minutes = Math.round(buf.duration / 60);
    throw new Error(`Recording is ~${minutes} min long. Maximum supported length is 60 minutes.`);
  }

  // Short enough and already small: upload untouched for best fidelity.
  if (file.size <= GATEWAY_MAX_BYTES && buf.duration <= CHUNK_SEC) {
    return { files: [file], durationSec: buf.duration, transcoded: false };
  }

  const mono = downmixToMono(buf);
  const pcm = resampleLinear(mono, buf.sampleRate, TARGET_SR);

  const base = file.name.replace(/\.[^.]+$/, "");
  const samplesPerChunk = CHUNK_SEC * TARGET_SR;
  const files: File[] = [];
  for (let start = 0, i = 0; start < pcm.length; start += samplesPerChunk, i++) {
    const slice = pcm.subarray(start, Math.min(start + samplesPerChunk, pcm.length));
    const wav = encodeWav16(slice, TARGET_SR);
    if (wav.size > GATEWAY_MAX_BYTES) throw new Error("Audio chunk too large to transcribe.");
    files.push(
      new File([wav], `${String(i).padStart(3, "0")}-${base}.wav`, { type: "audio/wav" }),
    );
  }

  return { files, durationSec: buf.duration, transcoded: true };
}
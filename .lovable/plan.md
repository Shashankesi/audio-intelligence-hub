# AudioInsight AI — Make It Real

Turn the current mock UI into a fully working product: real audio uploads, real transcription, real AI summaries, real auth, real history — plus a premium 3D hero and polish pass across every page.

## 1. Backend (Lovable Cloud)

Enable Lovable Cloud and provision:

**Auth**
- Email/password + magic-link via Lovable Cloud auth.
- Wire `/login`, `/signup`, `/forgot-password` to real auth calls.
- Add a route guard: dashboard routes redirect to `/login` when signed out.
- Profile page reads/edits the real user.

**Database (with RLS + grants)**
- `profiles` (id, display_name, avatar_url, plan)
- `recordings` (id, user_id, name, duration_sec, size_bytes, mime, storage_path, status, language, model, created_at)
- `transcripts` (recording_id, text, segments jsonb, wer numeric null, created_at)
- `summaries` (recording_id, short text, detailed text, action_items jsonb, sentiment jsonb, model, created_at)
- `user_roles` + `has_role()` (admin/user) per platform rules.
- All tables: proper GRANTs + RLS policies scoped to `auth.uid()`.

**Storage**
- Private bucket `recordings` with per-user folder RLS.

## 2. Real Audio Pipeline

Replace the fake progress bar with a real flow:

1. **Upload** (`/dashboard/upload`): drag/drop → direct upload to `recordings` bucket with progress; live waveform from `AudioContext` analyser on the actual file; insert `recordings` row (status=`queued`).
2. **Transcribe**: `createServerFn` `transcribeRecording` → download from storage → send to Lovable AI Gateway speech-to-text (Whisper-family model) → store `transcripts` row (text + segments + timings) → status=`transcribed`.
3. **Summarize**: `createServerFn` `summarizeRecording` → Gemini via Lovable AI Gateway with structured output (Zod) → `{ short, detailed, action_items[], sentiment{label, score, timeline[]} }` → status=`done`.
4. **Auto-chain**: upload → transcribe → summarize triggered client-side with toasts + retry on 402/429.

## 3. Pages Wired to Real Data

- **Overview**: real counts, minutes processed, recent 7-day activity from `recordings` (Recharts driven by live query).
- **Transcription**: opens a specific recording; inline editor saves back to `transcripts`; word count, search/highlight, segment timestamps, copy/export TXT/SRT/VTT.
- **Summary**: tabs render real fields; regenerate button re-runs summarizer; copy/share; sentiment timeline from real data.
- **History**: real searchable/sortable/filterable table over `recordings`; row actions: open, re-summarize, rename, delete (with storage cleanup).
- **Evaluation**: real per-model aggregates (avg latency, chars/sec, WER when reference provided); optional "upload reference transcript" to compute WER live.
- **Datasets**: user-owned reference sets used by Evaluation.
- **Profile / Settings**: real profile edit, avatar upload, theme (dark default, light toggle), default model, language, delete account.
- **Help**: real FAQ + contact form storing to `support_messages`.

## 4. Premium 3D + Motion Pass

- Add `@react-three/fiber` + `@react-three/drei`. Replace `OrbSphere` with a real WebGL scene: distorted icosahedron with `MeshDistortMaterial`, audio-reactive amplitude (uses mic or demo track), bloom postprocessing, mouse parallax, lazy-loaded behind `<ClientOnly>` (SSR-safe).
- Landing hero: 3D orb + animated gradient mesh backdrop; scroll-linked parallax with Framer Motion.
- Dashboard upload: live WebGL waveform bars driven by the file's `AnalyserNode`.
- Micro-interactions: magnetic buttons, tilt cards on Features, animated counters, marquee of "trusted by" logos, cursor-follow spotlight on hero.
- Page transitions via `AnimatePresence`.

## 5. Landing Polish

- Live Demo becomes a real 20-second sample: plays audio, streams a real transcription + summary using a public sample file, no login required (rate-limited server fn).
- Research section: real charts with plausible benchmark data + methodology note.
- FAQ with accordion, testimonials carousel, pricing teaser, CTA band.
- SEO per route: unique title, description, og:title/description, JSON-LD `SoftwareApplication` on `/`.

## 6. Quality Gates

- Typecheck + build clean.
- Playwright smoke: signup → upload sample → transcript appears → summary appears → shows in History.
- Verify 3D scene renders (screenshot) and does not SSR-crash.
- Toaster feedback + graceful 402/429 handling from AI Gateway.

## Technical Notes

- AI: Lovable AI Gateway. STT via speech-to-text model per platform catalog; chat/summary default `google/gemini-3.6-flash` with `Output.object` + Zod schema.
- Server functions live in `src/lib/*.functions.ts`; secrets read inside `.handler()`; storage/admin ops via dynamic import of `client.server` inside handlers only.
- Dashboard routes moved under `_authenticated/` layout that gates on session; loaders under it are safe to call protected server fns.
- 3D scene component behind `<ClientOnly>` + `React.lazy`; never statically imported by SSR routes.
- Migration includes: enum `app_role`, tables above, GRANTs, RLS policies, `has_role` SECURITY DEFINER, storage bucket + policies, triggers for `updated_at` and profile auto-create on signup.

## Scope / Time

This is a large change touching ~20 files plus a DB migration and 2 new packages (`three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`). I'll ship it in one pass and verify with a build + Playwright smoke run.

Approve to proceed, or tell me to trim (e.g. skip 3D, skip Evaluation/Datasets wiring, or keep Live Demo mocked).
import { memo, useEffect, useRef } from "react";

/**
 * Cinematic layered background: aurora ribbons, radial glows, grid lines,
 * drifting particles, tiny stars, a mouse spotlight and a moving noise film.
 * Everything animates on the compositor (transform/opacity only) so scrolling
 * stays buttery. Deterministic positions keep SSR and hydration in sync.
 */
const PARTICLES = Array.from({ length: 18 }).map((_, i) => ({
  left: ((i * 61) % 100) + (i % 3),
  top: ((i * 43) % 100) + (i % 5),
  size: i % 4 === 0 ? 2.5 : 1.5,
  dur: 11 + (i % 7) * 1.8,
  delay: (i % 9) * 0.8,
  hue: i % 3,
}));

const STARS = Array.from({ length: 40 }).map((_, i) => ({
  left: (i * 37.3) % 100,
  top: (i * 53.7) % 100,
  dur: 3 + (i % 5),
  delay: (i % 11) * 0.45,
}));

const HUES = [
  "oklch(0.62 0.21 293 / 0.85)",
  "oklch(0.62 0.19 258 / 0.85)",
  "oklch(0.86 0.21 160 / 0.75)",
];

function BackdropBase() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const el = ref.current;
        if (!el) return;
        el.style.setProperty("--mx", `${e.clientX}px`);
        el.style.setProperty("--my", `${e.clientY}px`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden [contain:strict]"
      style={{ ["--mx" as string]: "50vw", ["--my" as string]: "35vh" }}
    >
      {/* base wash */}
      <div className="absolute inset-0" style={{ background: "var(--gradient-radial)" }} />

      {/* aurora ribbons */}
      <div
        className="absolute -top-1/3 left-[-15%] h-[80vh] w-[80vw] rounded-full opacity-50 blur-[120px] animate-aurora"
        style={{ background: "conic-gradient(from 120deg at 50% 50%, oklch(0.55 0.25 295 / 0.55), oklch(0.62 0.19 258 / 0.4), transparent 55%)" }}
      />
      <div
        className="absolute top-[10%] right-[-20%] h-[70vh] w-[70vw] rounded-full opacity-40 blur-[130px] animate-aurora"
        style={{ background: "conic-gradient(from 260deg at 50% 50%, oklch(0.71 0.13 215 / 0.5), oklch(0.86 0.21 160 / 0.28), transparent 60%)", animationDelay: "-9s" }}
      />
      <div
        className="absolute bottom-[-25%] left-[20%] h-[65vh] w-[65vw] rounded-full opacity-35 blur-[140px] animate-aurora"
        style={{ background: "radial-gradient(circle, oklch(0.62 0.21 293 / 0.45), transparent 65%)", animationDelay: "-17s" }}
      />

      {/* subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(1_0_0/0.035)_1px,transparent_1px),linear-gradient(to_bottom,oklch(1_0_0/0.035)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_75%_60%_at_50%_35%,black,transparent_80%)]" />

      {/* glowing horizon line */}
      <div className="absolute left-0 right-0 top-[62vh] h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      {/* tiny stars */}
      {STARS.map((s, i) => (
        <span
          key={`s${i}`}
          className="absolute h-px w-px rounded-full bg-white/70 animate-twinkle"
          style={{ left: `${s.left}%`, top: `${s.top}%`, animationDuration: `${s.dur}s`, animationDelay: `${s.delay}s` }}
        />
      ))}

      {/* particles */}
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full animate-drift will-change-transform"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            height: p.size,
            width: p.size,
            background: HUES[p.hue],
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* mouse spotlight */}
      <div
        className="absolute inset-0 hidden md:block"
        style={{
          background:
            "radial-gradient(420px circle at var(--mx) var(--my), oklch(0.62 0.21 293 / 0.10), transparent 70%)",
        }}
      />

      {/* moving film grain */}
      <div className="noise-overlay animate-noise absolute -inset-[10%] opacity-[0.035] mix-blend-overlay" />
    </div>
  );
}

export const Backdrop = memo(BackdropBase);

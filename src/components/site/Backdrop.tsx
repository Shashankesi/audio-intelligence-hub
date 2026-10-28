import { memo } from "react";

/**
 * Calm enterprise background: a fixed neutral wash with a faint grid.
 * No aurora blobs, stars, particles or noise film — the data is the focus.
 */
function BackdropBase() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden [contain:strict]">
      {/* neutral wash with a whisper of blue/teal */}
      <div className="absolute inset-0" style={{ background: "var(--gradient-radial)" }} />
      {/* faint grid, fading out toward the edges */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(0.35_0.03_258/0.045)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.35_0.03_258/0.045)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_80%_55%_at_50%_0%,black,transparent_75%)]" />
    </div>
  );
}

export const Backdrop = memo(BackdropBase);

import type { ReactNode } from "react";

export function LaptopMock({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="relative">
      <div className="rounded-t-2xl border border-white/10 bg-black/60 p-2 shadow-soft">
        <div className="flex items-center gap-1.5 px-2 pb-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
          {label && <span className="ml-3 text-[10px] text-muted-foreground">{label}</span>}
        </div>
        <div className="overflow-hidden rounded-lg border border-white/10 bg-background/80">{children}</div>
      </div>
      <div className="mx-auto h-3 w-[105%] -translate-x-[2.5%] rounded-b-2xl bg-gradient-to-b from-white/10 to-transparent" />
    </div>
  );
}

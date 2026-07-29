import { useEffect, useRef, useState } from "react";

export function AnimatedCounter({ value, duration = 1200, format }: { value: number; duration?: number; format?: (n: number) => string }) {
  const [n, setN] = useState(0);
  const raf = useRef<number | null>(null);
  const start = useRef<number | null>(null);
  const from = useRef(0);

  useEffect(() => {
    from.current = n;
    start.current = null;
    const step = (t: number) => {
      if (start.current == null) start.current = t;
      const p = Math.min(1, (t - start.current) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(from.current + (value - from.current) * eased);
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return <>{format ? format(n) : Math.round(n).toLocaleString()}</>;
}
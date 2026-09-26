import { useEffect, useState } from "react";

/** Renders a server-authoritative deadline as a locally ticking countdown, no per-second network traffic needed. */
export function useCountdown(endsAt: number | null | undefined): number {
  // The state is only a re-render tick; the value is derived fresh each render so a
  // new deadline is reflected immediately rather than one effect-cycle late.
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!endsAt) return;
    const id = setInterval(() => {
      setTick((t) => t + 1);
      if (Date.now() >= endsAt) clearInterval(id);
    }, 200);
    return () => clearInterval(id);
  }, [endsAt]);

  return endsAt ? Math.max(0, endsAt - Date.now()) : 0;
}

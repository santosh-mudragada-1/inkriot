import { useEffect, useState } from "react";

/** Renders a server-authoritative deadline as a locally ticking countdown, no per-second network traffic needed. */
export function useCountdown(endsAt: number | null | undefined): number {
  const [remainingMs, setRemainingMs] = useState(() => (endsAt ? Math.max(0, endsAt - Date.now()) : 0));

  useEffect(() => {
    if (!endsAt) {
      setRemainingMs(0);
      return;
    }
    setRemainingMs(Math.max(0, endsAt - Date.now()));
    const id = setInterval(() => {
      setRemainingMs(Math.max(0, endsAt - Date.now()));
    }, 200);
    return () => clearInterval(id);
  }, [endsAt]);

  return remainingMs;
}

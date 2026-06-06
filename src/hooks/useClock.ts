import { useEffect, useState } from "react";

/**
 * useNow — returns the current Date, re-rendering every `intervalMs` (default
 * 1s). Used for the live clock so it ticks in real time.
 */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

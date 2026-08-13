/**
 * NetworkService — "is the internet actually usable yet?".
 *
 * At Windows startup the app is launched before Wi-Fi has associated, so
 * `navigator.onLine` is unreliable (it can report true while no route exists,
 * and it doesn't fire when a captive/slow adapter finally comes up). We
 * therefore combine the browser events with a light polling probe.
 */

const PROBE_URL = "https://api.aladhan.com/v1/status";
const PROBE_TIMEOUT_MS = 5000;

/** True when a real HTTPS request to our API host succeeds. */
export async function isOnline(): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return false;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(PROBE_URL, {
      signal: controller.signal,
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Call `handler` as soon as the connection is usable, and again on every
 * later reconnect. Polls with a backoff that starts fast (for the boot-time
 * "Wi-Fi is 10s away" case) and settles at a couple of minutes.
 */
export function onConnectivityRestored(handler: () => void): () => void {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let delay = 5000;
  const MAX_DELAY = 2 * 60 * 1000;
  let wasOnline = false;

  async function check() {
    if (stopped) return;
    const online = await isOnline();
    if (stopped) return;
    if (online) {
      if (!wasOnline) {
        wasOnline = true;
        handler();
      }
      delay = MAX_DELAY;
    } else {
      wasOnline = false;
      delay = Math.min(delay * 1.5, MAX_DELAY);
    }
    timer = setTimeout(() => void check(), delay);
  }

  // Browser hint: retry immediately when the adapter reports a connection.
  const onOnlineEvent = () => {
    wasOnline = false;
    delay = 3000;
    if (timer) clearTimeout(timer);
    void check();
  };
  window.addEventListener("online", onOnlineEvent);

  void check();

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    window.removeEventListener("online", onOnlineEvent);
  };
}

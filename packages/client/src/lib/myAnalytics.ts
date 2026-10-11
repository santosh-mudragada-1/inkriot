// My Analytics (https://my-analytics-ruby.vercel.app/p/inkriot).
// Page views, sessions and uncaught errors are automatic; this adds INKRIOT's game events.
// Every call is fail-silent — analytics can never interrupt a round.
import { initAnalytics } from "@my-analytics/client";

export { captureError, showFeedback, track } from "@my-analytics/client";

/**
 * Instagram/Facebook's in-app browser injects its own script (`iabjs://…`) that throws
 * "Java object is gone" as the page unloads. It's their bug, not ours; registered before
 * the SDK's listener so it never reaches the error dashboard.
 */
function ignoreInAppBrowserNoise() {
  window.addEventListener("error", (e) => {
    const where = `${e.filename ?? ""} ${e.error instanceof Error ? e.error.stack ?? "" : ""}`;
    if (where.includes("iabjs://")) e.stopImmediatePropagation();
  });
}

export function initMyAnalytics() {
  ignoreInAppBrowserNoise();
  initAnalytics({
    projectId: import.meta.env.VITE_ANALYTICS_PROJECT_ID,
    apiKey: import.meta.env.VITE_ANALYTICS_KEY,
    // Localhost traffic is ignored unless you opt in (handy when testing the integration).
    trackLocalhost: import.meta.env.VITE_ANALYTICS_TRACK_LOCALHOST === "true",
  });
}

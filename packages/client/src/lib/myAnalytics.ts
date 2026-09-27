// My Analytics (https://my-analytics-ruby.vercel.app/p/inkriot).
// Page views, sessions and uncaught errors are automatic; this adds INKRIOT's game events.
// Every call is fail-silent — analytics can never interrupt a round.
import { initAnalytics } from "@my-analytics/client";

export { captureError, showFeedback, track } from "@my-analytics/client";

export function initMyAnalytics() {
  initAnalytics({
    projectId: import.meta.env.VITE_ANALYTICS_PROJECT_ID,
    apiKey: import.meta.env.VITE_ANALYTICS_KEY,
    // Localhost traffic is ignored unless you opt in (handy when testing the integration).
    trackLocalhost: import.meta.env.VITE_ANALYTICS_TRACK_LOCALHOST === "true",
  });
}

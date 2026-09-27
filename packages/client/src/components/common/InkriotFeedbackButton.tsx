import { useLocation } from "react-router-dom";
import { FeedbackButton } from "@my-analytics/client/react";

/**
 * 💬 Feedback in INKRIOT's colors — landing page only. Rooms are dense (canvas, guess box, lobby
 * settings), so in-game feedback lives on the end screen instead ("Send feedback").
 */
export function InkriotFeedbackButton() {
  const { pathname } = useLocation();
  if (pathname !== "/") return null;
  return <FeedbackButton accentColor="#ff5a36" theme="light" fontFamily="Nunito, ui-rounded, system-ui, sans-serif" />;
}

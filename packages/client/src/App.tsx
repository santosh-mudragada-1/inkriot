import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { CustomCursor } from "./components/common/CustomCursor";
import { SoundToggle } from "./components/common/SoundToggle";
import { ProgressToasts } from "./components/common/ProgressToasts";
import { useSocketBridge } from "./hooks/useSocketBridge";
import { audio } from "./lib/audio/AudioManager";
import LandingPage from "./pages/LandingPage";
import RoomPage from "./pages/RoomPage";
import "./App.css";
import { InkriotFeedbackButton } from "./components/common/InkriotFeedbackButton";

// The product teaser is a standalone film page; loaded on demand so GSAP stays out of the game bundle.
const TeaserPage = lazy(() => import("./teaser/TeaserPage"));

export default function App() {
  useSocketBridge();
  const { pathname } = useLocation();

  useEffect(() => {
    const unlock = () => {
      audio.unlock();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  if (pathname === "/teaser") {
    return (
      <Suspense fallback={null}>
        <TeaserPage />
      </Suspense>
    );
  }

  return (
    <>
      <CustomCursor />
      <SoundToggle />
      <ProgressToasts />
      <InkriotFeedbackButton />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/room/:code" element={<RoomPage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </>
  );
}

import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { CustomCursor } from "./components/common/CustomCursor";
import { SoundToggle } from "./components/common/SoundToggle";
import { ProgressToasts } from "./components/common/ProgressToasts";
import { useSocketBridge } from "./hooks/useSocketBridge";
import { audio } from "./lib/audio/AudioManager";
import LandingPage from "./pages/LandingPage";
import RoomPage from "./pages/RoomPage";
import "./App.css";
import { InkriotFeedbackButton } from "./components/common/InkriotFeedbackButton";

export default function App() {
  useSocketBridge();

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

import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useGameStore } from "../store/useGameStore";
import { socket } from "../lib/socket";
import { loadSession, saveSession } from "../lib/session";
import { useProfile } from "../lib/profile";
import { ProfileCard } from "../components/profile/ProfileCard";
import { Logo } from "../components/common/Logo";
import { Button } from "../components/common/Button";
import Lobby from "../components/lobby/Lobby";
import GameScreen from "../components/game/GameScreen";
import EndScreen from "../components/game/EndScreen";
import "./RoomPage.css";

type JoinState = "checking" | "rejoining" | "need-name" | "joining" | "ready" | "failed";

export default function RoomPage() {
  const { code = "" } = useParams();
  const roomCode = code.toUpperCase();
  const navigate = useNavigate();
  const room = useGameStore((s) => s.room);
  const connected = useGameStore((s) => s.connected);
  const [state, setState] = useState<JoinState>("checking");
  const nickname = useProfile((s) => s.nickname);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { activeCode } = useGameStore.getState();
    if (room && room.code === roomCode && activeCode === roomCode) {
      setState("ready");
      return;
    }
    // Arrived here while still attached to a different room (e.g. pasted a new link):
    // leave it first so its updates can't bleed into this one.
    if (activeCode && activeCode !== roomCode) {
      if (socket.connected) socket.emit("leave_room");
      useGameStore.getState().reset();
    }
    if (!connected) return;

    const session = loadSession();
    if (session && session.code === roomCode) {
      setState("rejoining");
      socket.emit("rejoin_room", { code: roomCode, sessionId: session.sessionId }, (res) => {
        if (res.ok && res.playerId) {
          useGameStore.getState().enterRoom(roomCode, res.playerId);
          setState("ready");
        } else {
          setState("need-name");
        }
      });
    } else {
      setState("need-name");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, roomCode]);

  const submitJoin = (e?: FormEvent) => {
    e?.preventDefault();
    if (!nickname.trim()) return setError("Pick a name first — it's how friends will spot you.");
    setState("joining");
    setError(null);
    socket.emit("join_room", { code: roomCode, nickname: nickname.trim(), avatar: useProfile.getState().encoded() }, (res) => {
      if (res.ok && res.code && res.sessionId && res.playerId) {
        saveSession({ code: res.code, sessionId: res.sessionId, playerId: res.playerId, nickname: nickname.trim() });
        useGameStore.getState().enterRoom(res.code, res.playerId);
        setState("ready");
      } else {
        setError(res.error ?? "Couldn't join that room.");
        setState("need-name");
      }
    });
  };

  if (state === "ready" && room && room.code === roomCode) {
    if (room.phase === "GAME_COMPLETE") return <EndScreen />;
    if (room.phase === "LOBBY") return <Lobby />;
    return <GameScreen />;
  }

  return (
    <div className="room-gate">
      {(state === "checking" || state === "rejoining" || state === "joining") && (
        <div className="room-gate-loading">
          <motion.div className="room-gate-spinner" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }} />
          <span className="hand">{state === "joining" ? "squeezing you in…" : "finding the room…"}</span>
        </div>
      )}
      {state === "need-name" && (
        <motion.form
          className="room-gate-form"
          onSubmit={submitJoin}
          initial={{ opacity: 0, y: 24, rotate: 2 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ type: "spring", stiffness: 340, damping: 24 }}
        >
          <Logo size="sm" onClick={() => navigate("/")} />
          <h1 className="room-gate-title">
            You're invited to room <span className="room-gate-code">{roomCode}</span>
          </h1>
          <ProfileCard nameError={error} onNameEnter={() => submitJoin()} />
          <div className="entry-actions">
            <Button type="button" variant="ghost" onClick={() => navigate("/")}>
              Back to home
            </Button>
            <Button type="submit" variant="primary" size="lg" display>
              Jump in →
            </Button>
          </div>
        </motion.form>
      )}
      {state === "failed" && <p>Couldn\u2019t open this room. Head back home and try the code again.</p>}
    </div>
  );
}

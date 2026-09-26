import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useGameStore } from "../store/useGameStore";
import { socket } from "../lib/socket";
import { loadNickname, loadSession, saveNickname, saveSession } from "../lib/session";
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
  const [nickname, setNickname] = useState(loadNickname());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (room && room.code === roomCode) {
      setState("ready");
      return;
    }
    if (!connected) return;

    const session = loadSession();
    if (session && session.code === roomCode) {
      setState("rejoining");
      socket.emit("rejoin_room", { code: roomCode, sessionId: session.sessionId }, (res) => {
        if (res.ok && res.playerId) {
          useGameStore.getState().setSelfId(res.playerId);
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

  const submitJoin = (e: FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return setError("Give yourself a name first.");
    setState("joining");
    setError(null);
    saveNickname(nickname.trim());
    socket.emit("join_room", { code: roomCode, nickname: nickname.trim() }, (res) => {
      if (res.ok && res.code && res.sessionId && res.playerId) {
        saveSession({ code: res.code, sessionId: res.sessionId, playerId: res.playerId, nickname: nickname.trim() });
        useGameStore.getState().setSelfId(res.playerId);
        setState("ready");
      } else {
        setError(res.error ?? "Couldn't join that room.");
        setState("need-name");
      }
    });
  };

  if (state === "ready" && room) {
    if (room.phase === "GAME_COMPLETE") return <EndScreen />;
    if (room.phase === "LOBBY") return <Lobby />;
    return <GameScreen />;
  }

  return (
    <div className="room-gate">
      {(state === "checking" || state === "rejoining" || state === "joining") && (
        <motion.div className="room-gate-spinner" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} />
      )}
      {state === "need-name" && (
        <motion.form
          className="room-gate-form"
          onSubmit={submitJoin}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 340, damping: 28 }}
        >
          <span className="room-gate-code">Room {roomCode}</span>
          <label className="entry-label" htmlFor="rp-nickname">
            What&rsquo;s your name?
          </label>
          <input
            id="rp-nickname"
            className="entry-input"
            placeholder="Nickname"
            maxLength={16}
            autoFocus
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          {error && <p className="entry-error">{error}</p>}
          <div className="entry-actions">
            <Button type="button" variant="ghost" onClick={() => navigate("/")}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Join room
            </Button>
          </div>
        </motion.form>
      )}
      {state === "failed" && <p>Something went wrong.</p>}
    </div>
  );
}

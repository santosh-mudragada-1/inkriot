import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { JoinRoomResult } from "@inkriot/shared";
import { socket, waitForConnection } from "../lib/socket";
import { loadSeenWords } from "../lib/seenWords";
import { saveSession, saveNickname } from "../lib/session";
import { useGameStore } from "../store/useGameStore";
import { useProfile } from "../lib/profile";
import { captureError, track } from "../lib/myAnalytics";

function withTimeout<T>(fn: (cb: (res: T) => void) => void, ms = 6000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Could not reach the server. Check your connection and try again.")), ms);
    fn((res) => {
      clearTimeout(timer);
      resolve(res);
    });
  });
}

/** Render's free tier sleeps when idle and takes up to a minute to wake. */
const WAKE_TIMEOUT_MS = 75_000;
const SLOW_WAKE_HINT_MS = 2500;

export function useRoomActions() {
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  /** True while we're waiting on a sleeping server, so the UI can say so instead of looking stuck. */
  const [waking, setWaking] = useState(false);

  const connect = useCallback(async () => {
    if (socket.connected) return;
    const hint = setTimeout(() => setWaking(true), SLOW_WAKE_HINT_MS);
    try {
      await waitForConnection(WAKE_TIMEOUT_MS);
    } finally {
      clearTimeout(hint);
      setWaking(false);
    }
  }, []);
  const [error, setError] = useState<string | null>(null);

  const createRoom = useCallback(
    async (nickname: string) => {
      setPending(true);
      setError(null);
      try {
        await connect();
        const res = await withTimeout<JoinRoomResult>((cb) =>
          socket.emit("create_room", { nickname, avatar: useProfile.getState().encoded(), recentWords: loadSeenWords() }, cb),
        );
        if (!res.ok || !res.code || !res.sessionId || !res.playerId) {
          setError(res.error ?? "Something went wrong creating the room.");
          return;
        }
        saveNickname(nickname);
        saveSession({ code: res.code, sessionId: res.sessionId, playerId: res.playerId, nickname });
        useGameStore.getState().enterRoom(res.code, res.playerId);
        track("room_created");
        navigate(`/room/${res.code}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
        captureError(e, { where: "create_room" });
      } finally {
        setPending(false);
      }
    },
    [navigate, connect],
  );

  const joinRoom = useCallback(
    async (code: string, nickname: string) => {
      setPending(true);
      setError(null);
      try {
        const cleanCode = code.trim().toUpperCase();
        await connect();
        const res = await withTimeout<JoinRoomResult>((cb) =>
          socket.emit("join_room", { code: cleanCode, nickname, avatar: useProfile.getState().encoded(), recentWords: loadSeenWords() }, cb),
        );
        if (!res.ok || !res.code || !res.sessionId || !res.playerId) {
          setError(res.error ?? "Couldn't join that room.");
          track("room_join_failed", { reason: (res.error ?? "unknown").slice(0, 60), via: "code" });
          return;
        }
        saveNickname(nickname);
        saveSession({ code: res.code, sessionId: res.sessionId, playerId: res.playerId, nickname });
        useGameStore.getState().enterRoom(res.code, res.playerId);
        track("room_joined", { via: "code" });
        navigate(`/room/${res.code}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
        captureError(e, { where: "join_room" });
      } finally {
        setPending(false);
      }
    },
    [navigate, connect],
  );

  return { createRoom, joinRoom, pending, waking, error, setError };
}

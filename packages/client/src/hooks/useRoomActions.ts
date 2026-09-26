import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { JoinRoomResult } from "@inkriot/shared";
import { socket } from "../lib/socket";
import { saveSession, saveNickname } from "../lib/session";
import { useGameStore } from "../store/useGameStore";
import { useProfile } from "../lib/profile";

function withTimeout<T>(fn: (cb: (res: T) => void) => void, ms = 6000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Could not reach the server. Check your connection and try again.")), ms);
    fn((res) => {
      clearTimeout(timer);
      resolve(res);
    });
  });
}

export function useRoomActions() {
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRoom = useCallback(
    async (nickname: string) => {
      setPending(true);
      setError(null);
      try {
        const res = await withTimeout<JoinRoomResult>((cb) => socket.emit("create_room", { nickname, avatar: useProfile.getState().encoded() }, cb));
        if (!res.ok || !res.code || !res.sessionId || !res.playerId) {
          setError(res.error ?? "Something went wrong creating the room.");
          return;
        }
        saveNickname(nickname);
        saveSession({ code: res.code, sessionId: res.sessionId, playerId: res.playerId, nickname });
        useGameStore.getState().setSelfId(res.playerId);
        navigate(`/room/${res.code}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        setPending(false);
      }
    },
    [navigate],
  );

  const joinRoom = useCallback(
    async (code: string, nickname: string) => {
      setPending(true);
      setError(null);
      try {
        const cleanCode = code.trim().toUpperCase();
        const res = await withTimeout<JoinRoomResult>((cb) => socket.emit("join_room", { code: cleanCode, nickname, avatar: useProfile.getState().encoded() }, cb));
        if (!res.ok || !res.code || !res.sessionId || !res.playerId) {
          setError(res.error ?? "Couldn't join that room.");
          return;
        }
        saveNickname(nickname);
        saveSession({ code: res.code, sessionId: res.sessionId, playerId: res.playerId, nickname });
        useGameStore.getState().setSelfId(res.playerId);
        navigate(`/room/${res.code}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        setPending(false);
      }
    },
    [navigate],
  );

  return { createRoom, joinRoom, pending, error, setError };
}

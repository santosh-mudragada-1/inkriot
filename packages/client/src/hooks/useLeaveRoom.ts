import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../lib/socket";
import { useGameStore } from "../store/useGameStore";
import { clearSession } from "../lib/session";

/** Leaves the current room (if any) and returns to the landing page — used by the logo. */
export function useLeaveRoom() {
  const navigate = useNavigate();
  return useCallback(() => {
    if (socket.connected) socket.emit("leave_room");
    useGameStore.getState().reset();
    clearSession();
    navigate("/");
  }, [navigate]);
}

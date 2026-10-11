import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@inkriot/shared";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER_URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
  // Retry fast: a phone coming back from the background should be back in the game in a second or two.
  reconnectionDelay: 500,
  reconnectionDelayMax: 2000,
});

/** Resolves once the socket is connected — which can take ~a minute if the server was asleep. */
export function waitForConnection(ms: number): Promise<void> {
  if (socket.connected) return Promise.resolve();
  if (!socket.active) socket.connect();
  return new Promise((resolve, reject) => {
    const done = () => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      socket.off("connect", done);
      reject(new Error("Could not reach the server. Check your connection and try again."));
    }, ms);
    socket.once("connect", done);
  });
}

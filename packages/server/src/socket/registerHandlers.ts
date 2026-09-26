import { Server, Socket } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents } from "@inkriot/shared";
import { RoomManager } from "../rooms/RoomManager.js";
import { Room } from "../rooms/Room.js";

export interface SocketSessionData {
  roomCode?: string;
  playerId?: string;
}

type IOServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketSessionData>;
type IOSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketSessionData>;

export function registerHandlers(io: IOServer, manager: RoomManager) {
  io.on("connection", (socket: IOSocket) => {
    socket.on("create_room", ({ nickname }, cb) => {
      const room = manager.createRoom();
      const result = room.addPlayer(nickname, socket.id);
      if ("error" in result) return cb({ ok: false, error: result.error });
      socket.data.roomCode = room.code;
      socket.data.playerId = result.playerId;
      socket.join(room.code);
      cb({ ok: true, code: room.code, sessionId: result.sessionId, playerId: result.playerId });
      room.broadcastState();
    });

    socket.on("join_room", ({ code, nickname, sessionId }, cb) => {
      const room = manager.getRoom(code);
      if (!room) return cb({ ok: false, error: "Room not found. Check the code and try again." });

      if (sessionId) {
        const result = room.reconnectPlayer(sessionId, socket.id);
        if (!("error" in result)) {
          socket.data.roomCode = room.code;
          socket.data.playerId = result.playerId;
          socket.join(room.code);
          cb({ ok: true, code: room.code, sessionId, playerId: result.playerId });
          room.addSystemMessage(`Reconnected.`);
          sendJoinExtras(socket, room, result.playerId);
          return;
        }
      }

      const result = room.addPlayer(nickname, socket.id);
      if ("error" in result) return cb({ ok: false, error: result.error });
      socket.data.roomCode = room.code;
      socket.data.playerId = result.playerId;
      socket.join(room.code);
      cb({ ok: true, code: room.code, sessionId: result.sessionId, playerId: result.playerId });
      const player = room.players.get(result.playerId);
      if (player) room.addSystemMessage(`${player.name} joined the room.`);
      sendJoinExtras(socket, room, result.playerId);
    });

    socket.on("rejoin_room", ({ code, sessionId }, cb) => {
      const room = manager.getRoom(code);
      if (!room) return cb({ ok: false, error: "Room not found." });
      const result = room.reconnectPlayer(sessionId, socket.id);
      if ("error" in result) return cb({ ok: false, error: result.error });
      socket.data.roomCode = room.code;
      socket.data.playerId = result.playerId;
      socket.join(room.code);
      cb({ ok: true, code: room.code, sessionId, playerId: result.playerId });
      sendJoinExtras(socket, room, result.playerId);
    });

    socket.on("start_game", () => {
      const room = currentRoom(socket, manager);
      if (!room || !socket.data.playerId) return;
      if (!room.isHost(socket.data.playerId)) return;
      room.startGame();
    });

    socket.on("update_settings", (settings) => {
      const room = currentRoom(socket, manager);
      if (!room || !socket.data.playerId) return;
      room.updateSettings(socket.data.playerId, settings);
    });

    socket.on("select_word", (word) => {
      const room = currentRoom(socket, manager);
      if (!room || !socket.data.playerId) return;
      room.selectWord(socket.data.playerId, word);
    });

    socket.on("submit_guess", (text) => {
      const room = currentRoom(socket, manager);
      if (!room || !socket.data.playerId) return;
      room.handleGuess(socket.data.playerId, text);
    });

    socket.on("send_reaction", (emoji) => {
      const room = currentRoom(socket, manager);
      if (!room || !socket.data.playerId) return;
      room.sendReaction(socket.data.playerId, emoji);
    });

    socket.on("draw_op", (op) => {
      const room = currentRoom(socket, manager);
      if (!room || !socket.data.playerId) return;
      room.handleDrawOp(socket.data.playerId, op);
    });

    socket.on("play_again", () => {
      const room = currentRoom(socket, manager);
      if (!room || !socket.data.playerId) return;
      room.playAgain(socket.data.playerId);
    });

    socket.on("leave_room", () => {
      const room = currentRoom(socket, manager);
      if (!room || !socket.data.playerId) return;
      room.removePlayer(socket.data.playerId);
      socket.leave(room.code);
      socket.data.roomCode = undefined;
      socket.data.playerId = undefined;
    });

    socket.on("disconnect", () => {
      const room = currentRoom(socket, manager);
      if (!room || !socket.data.playerId) return;
      room.markDisconnected(socket.data.playerId);
    });
  });
}

function currentRoom(socket: IOSocket, manager: RoomManager) {
  if (!socket.data.roomCode) return undefined;
  return manager.getRoom(socket.data.roomCode);
}

function sendJoinExtras(socket: IOSocket, room: Room, playerId: string) {
  room.broadcastState();
  const ops = room.getCanvasOps();
  if (ops.length) socket.emit("canvas_history", ops);
}

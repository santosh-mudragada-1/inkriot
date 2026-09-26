import { Server } from "socket.io";
import { ClientToServerEvents, ROOM_IDLE_EXPIRY_MS, ServerToClientEvents, generateRoomCode } from "@inkriot/shared";
import { Room } from "./Room.js";

type IOServer = Server<ClientToServerEvents, ServerToClientEvents>;

export class RoomManager {
  private rooms = new Map<string, Room>();
  private io: IOServer;

  constructor(io: IOServer) {
    this.io = io;
    setInterval(() => this.sweepIdleRooms(), 60_000).unref();
  }

  createRoom(): Room {
    let code = generateRoomCode();
    while (this.rooms.has(code)) code = generateRoomCode();
    const room = new Room(code, this.io, () => this.scheduleRemoval(code));
    this.rooms.set(code, room);
    return room;
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  private scheduleRemoval(code: string) {
    setTimeout(() => {
      const room = this.rooms.get(code);
      if (room && room.isEmpty()) this.rooms.delete(code);
    }, 5_000);
  }

  private sweepIdleRooms() {
    const now = Date.now();
    for (const [code, room] of this.rooms) {
      if (room.isEmpty() || now - room.lastActivityAt > ROOM_IDLE_EXPIRY_MS) {
        this.rooms.delete(code);
      }
    }
  }
}

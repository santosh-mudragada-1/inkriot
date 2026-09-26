import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents } from "@inkriot/shared";
import { RoomManager } from "./rooms/RoomManager.js";
import { registerHandlers } from "./socket/registerHandlers.js";

const PORT = Number(process.env.PORT) || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN?.split(",") ?? ["http://localhost:5173"];

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.get("/health", (_req, res) => res.json({ ok: true, name: "inkriot-server" }));

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: CLIENT_ORIGIN },
});

const manager = new RoomManager(io);
registerHandlers(io, manager);

httpServer.listen(PORT, () => {
  console.log(`INKRIOT server listening on :${PORT}`);
});

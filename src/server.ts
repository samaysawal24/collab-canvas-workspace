import http from "http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { WebSocketServer, WebSocket } from "ws";
import { apiRouter } from "./api/routes";
import { RoomManager, ConnectedPeer } from "./ws/roomManager";
import { CRDTOperation } from "./types";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());
app.use("/api/v1", apiRouter);

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (socket: WebSocket, req) => {
  const url = new URL(req.url || "", `http://${req.headers.host}`);
  const roomId = url.searchParams.get("roomId") || "general-room";
  const userId = url.searchParams.get("userId") || `user_${Math.random().toString(36).substring(2, 6)}`;

  const peer: ConnectedPeer = RoomManager.joinRoom(roomId, userId, socket);

  socket.on("message", (data: string) => {
    try {
      const op: CRDTOperation = JSON.parse(data);
      RoomManager.handleOperation(peer, op);
    } catch (err) {
      console.error("[WebSocket Error] Failed to parse message:", err);
    }
  });

  socket.on("close", () => {
    RoomManager.leaveRoom(peer);
  });
});

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    console.log(`[Collab Canvas Workspace] HTTP and WebSocket server listening on port ${PORT}`);
  });
}

export { app, server };

import { Router, Request, Response } from "express";
import { RoomManager } from "../ws/roomManager";

export const apiRouter = Router();

apiRouter.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    service: "collab-canvas-workspace",
    author: "smay <cricketworldsamay@gmail.com>",
    timestamp: new Date().toISOString(),
  });
});

apiRouter.get("/rooms/:roomId/snapshot", (req: Request, res: Response) => {
  const { roomId } = req.params;
  const room = RoomManager.getOrCreateRoom(roomId);
  res.json({
    roomId,
    blocksCount: room.crdt.getOrderedBlocks().length,
    blocks: room.crdt.getOrderedBlocks(),
    activeUsersCount: room.presence.getActivePresences().length,
    activeUsers: room.presence.getActivePresences(),
    lamportClock: room.crdt.getLamportClock(),
  });
});

apiRouter.get("/rooms/:roomId/export/markdown", (req: Request, res: Response) => {
  const { roomId } = req.params;
  const room = RoomManager.getOrCreateRoom(roomId);
  const markdown = room.crdt.exportMarkdown();

  res.setHeader("Content-Type", "text/markdown");
  res.setHeader("Content-Disposition", `attachment; filename="${roomId}.md"`);
  res.send(markdown);
});


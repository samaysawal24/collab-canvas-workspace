import { WebSocket } from "ws";
import { BlockCRDTState } from "../crdt/blockState";
import { PresenceManager } from "../crdt/presence";
import { CRDTOperation } from "../types";

export interface ConnectedPeer {
  socket: WebSocket;
  userId: string;
  roomId: string;
}

export class RoomManager {
  private static rooms: Map<
    string,
    {
      crdt: BlockCRDTState;
      presence: PresenceManager;
      peers: Set<ConnectedPeer>;
    }
  > = new Map();

  static getOrCreateRoom(roomId: string) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        crdt: new BlockCRDTState(),
        presence: new PresenceManager(),
        peers: new Set(),
      });
    }
    return this.rooms.get(roomId)!;
  }

  static joinRoom(roomId: string, userId: string, socket: WebSocket): ConnectedPeer {
    const room = this.getOrCreateRoom(roomId);
    const peer: ConnectedPeer = { socket, userId, roomId };
    room.peers.add(peer);

    // Register presence
    room.presence.registerOrUpdate({ userId });

    // Send initial document state to joining peer
    socket.send(
      JSON.stringify({
        type: "SYNC_INITIAL_STATE",
        roomId,
        blocks: room.crdt.getOrderedBlocks(),
        activeUsers: room.presence.getActivePresences(),
        lamportClock: room.crdt.getLamportClock(),
      })
    );

    // Broadcast new presence to room
    this.broadcast(roomId, {
      type: "USER_JOINED",
      roomId,
      userId,
      activeUsers: room.presence.getActivePresences(),
    });

    return peer;
  }

  static leaveRoom(peer: ConnectedPeer) {
    const room = this.rooms.get(peer.roomId);
    if (!room) return;

    room.peers.delete(peer);
    room.presence.removeUser(peer.userId);

    this.broadcast(peer.roomId, {
      type: "USER_LEFT",
      roomId: peer.roomId,
      userId: peer.userId,
      activeUsers: room.presence.getActivePresences(),
    });
  }

  static handleOperation(peer: ConnectedPeer, op: CRDTOperation) {
    const room = this.getOrCreateRoom(op.roomId);

    switch (op.type) {
      case "INSERT_BLOCK":
        room.crdt.applyInsert(op.payload.block, op.clientLamportClock);
        break;
      case "UPDATE_BLOCK":
        room.crdt.applyUpdate(op.payload.blockId, op.payload.content, peer.userId, op.clientLamportClock);
        break;
      case "DELETE_BLOCK":
        room.crdt.applyDelete(op.payload.blockId, op.clientLamportClock);
        break;
      case "REORDER_BLOCK":
        room.crdt.applyReorder(op.payload.blockId, op.payload.newOrder, op.clientLamportClock);
        break;
      case "PRESENCE_PING":
        room.presence.registerOrUpdate({
          userId: peer.userId,
          cursorPosition: op.payload.cursorPosition,
        });
        break;
    }

    // Broadcast mutation to all other peers in the room
    this.broadcast(
      op.roomId,
      {
        type: "REMOTE_OP_BROADCAST",
        op,
        activeUsers: room.presence.getActivePresences(),
        serverLamportClock: room.crdt.getLamportClock(),
      },
      peer.socket
    );
  }

  static broadcast(roomId: string, message: any, excludeSocket?: WebSocket) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const payload = JSON.stringify(message);
    for (const peer of room.peers) {
      if (peer.socket !== excludeSocket && peer.socket.readyState === WebSocket.OPEN) {
        peer.socket.send(payload);
      }
    }
  }
}

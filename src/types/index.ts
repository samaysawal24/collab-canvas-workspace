export type BlockType = "paragraph" | "heading1" | "heading2" | "code" | "bullet_list" | "callout";

export interface DocumentBlock {
  id: string;
  type: BlockType;
  content: string;
  order: number;
  lastEditedBy: string;
  version: number;
  updatedAt: string;
}

export interface UserPresence {
  userId: string;
  name: string;
  color: string;
  cursorPosition?: {
    blockId: string;
    offset: number;
  };
  lastActive: string;
}

export interface CRDTOperation {
  type: "INSERT_BLOCK" | "UPDATE_BLOCK" | "DELETE_BLOCK" | "REORDER_BLOCK" | "PRESENCE_PING";
  roomId: string;
  payload: any;
  clientLamportClock: number;
}


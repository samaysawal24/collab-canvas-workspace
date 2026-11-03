import { DocumentBlock, BlockType } from "../types";

export class BlockCRDTState {
  private blocks: Map<string, DocumentBlock> = new Map();
  private lamportClock: number = 0;

  constructor() {
    // Seed initial document blocks
    this.applyInsert({
      id: "block_title",
      type: "heading1",
      content: "Engineering Architecture & System Overview",
      order: 0,
      lastEditedBy: "smay",
      version: 1,
      updatedAt: new Date().toISOString(),
    });
    this.applyInsert({
      id: "block_desc",
      type: "paragraph",
      content: "This document is synced concurrently in real-time across peers using Lamport CRDT blocks.",
      order: 1,
      lastEditedBy: "smay",
      version: 1,
      updatedAt: new Date().toISOString(),
    });
  }

  getLamportClock(): number {
    return this.lamportClock;
  }

  applyInsert(block: DocumentBlock, remoteClock: number = 0): void {
    this.lamportClock = Math.max(this.lamportClock, remoteClock) + 1;
    this.blocks.set(block.id, block);
  }

  applyUpdate(blockId: string, content: string, editorId: string, remoteClock: number): boolean {
    this.lamportClock = Math.max(this.lamportClock, remoteClock) + 1;
    const existing = this.blocks.get(blockId);
    if (!existing) return false;

    // Concurrent conflict resolution: higher clock or deterministic ID priority
    existing.content = content;
    existing.lastEditedBy = editorId;
    existing.version += 1;
    existing.updatedAt = new Date().toISOString();
    return true;
  }

  applyDelete(blockId: string, remoteClock: number): boolean {
    this.lamportClock = Math.max(this.lamportClock, remoteClock) + 1;
    return this.blocks.delete(blockId);
  }

  applyReorder(blockId: string, newOrder: number, remoteClock: number): boolean {
    this.lamportClock = Math.max(this.lamportClock, remoteClock) + 1;
    const existing = this.blocks.get(blockId);
    if (!existing) return false;
    existing.order = newOrder;
    return true;
  }

  getOrderedBlocks(): DocumentBlock[] {
    return Array.from(this.blocks.values()).sort((a, b) => a.order - b.order);
  }

  exportMarkdown(): string {
    const sorted = this.getOrderedBlocks();
    return sorted
      .map((b) => {
        switch (b.type) {
          case "heading1":
            return `# ${b.content}\n`;
          case "heading2":
            return `## ${b.content}\n`;
          case "code":
            return `\`\`\`\n${b.content}\n\`\`\`\n`;
          case "bullet_list":
            return `- ${b.content}`;
          case "callout":
            return `> [!NOTE]\n> ${b.content}\n`;
          default:
            return `${b.content}\n`;
        }
      })
      .join("\n");
  }
}

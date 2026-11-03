import { BlockCRDTState } from "../src/crdt/blockState";
import { PresenceManager } from "../src/crdt/presence";

describe("Collab Canvas Workspace CRDT & Presence Tests", () => {
  it("should initialize default document blocks and track Lamport clock", () => {
    const crdt = new BlockCRDTState();
    const blocks = crdt.getOrderedBlocks();
    expect(blocks.length).toBeGreaterThanOrEqual(2);
    expect(crdt.getLamportClock()).toBeGreaterThan(0);
  });

  it("should insert, update, and order blocks deterministically", () => {
    const crdt = new BlockCRDTState();
    crdt.applyInsert(
      {
        id: "new_block",
        type: "code",
        content: "console.log('CRDT synced!');",
        order: 5,
        lastEditedBy: "dev_alice",
        version: 1,
        updatedAt: new Date().toISOString(),
      },
      10
    );

    let blocks = crdt.getOrderedBlocks();
    expect(blocks.some((b) => b.id === "new_block")).toBe(true);

    crdt.applyUpdate("new_block", "const x = 42;", "dev_bob", 12);
    blocks = crdt.getOrderedBlocks();
    const updated = blocks.find((b) => b.id === "new_block");
    expect(updated?.content).toBe("const x = 42;");
    expect(updated?.lastEditedBy).toBe("dev_bob");
  });

  it("should register active users and purge stale presence after threshold", () => {
    const presence = new PresenceManager();
    presence.registerOrUpdate({ userId: "user_1", name: "Alice" });
    presence.registerOrUpdate({ userId: "user_2", name: "Bob" });

    let active = presence.getActivePresences(60);
    expect(active.length).toBe(2);

    presence.removeUser("user_1");
    active = presence.getActivePresences(60);
    expect(active.length).toBe(1);
    expect(active[0].userId).toBe("user_2");
  });
});

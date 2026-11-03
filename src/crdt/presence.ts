import { UserPresence } from "../types";

const AVATAR_COLORS = ["#EF4444", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];

export class PresenceManager {
  private users: Map<string, UserPresence> = new Map();

  registerOrUpdate(presence: Partial<UserPresence> & { userId: string }): UserPresence {
    const existing = this.users.get(presence.userId);
    const color =
      existing?.color ||
      presence.color ||
      AVATAR_COLORS[Math.abs(presence.userId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) % AVATAR_COLORS.length];

    const updated: UserPresence = {
      userId: presence.userId,
      name: presence.name || existing?.name || `User_${presence.userId.substring(0, 4)}`,
      color,
      cursorPosition: presence.cursorPosition || existing?.cursorPosition,
      lastActive: new Date().toISOString(),
    };

    this.users.set(presence.userId, updated);
    return updated;
  }

  removeUser(userId: string): boolean {
    return this.users.delete(userId);
  }

  getActivePresences(maxInactiveSeconds: number = 30): UserPresence[] {
    const now = Date.now();
    const thresholdMs = maxInactiveSeconds * 1000;
    const active: UserPresence[] = [];

    for (const [id, user] of this.users.entries()) {
      const diff = now - new Date(user.lastActive).getTime();
      if (diff <= thresholdMs) {
        active.push(user);
      } else {
        this.users.delete(id); // purge stale user
      }
    }

    return active;
  }
}


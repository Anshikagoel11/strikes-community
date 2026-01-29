import { Redis } from "ioredis";

export interface UserSession {
    userId: string;
    serverId?: string;
    socketId: string;
    connectedAt: number;
    lastSeen: number;
}

export class SessionManager {
    private redis: Redis;
    private readonly SESSION_TTL = 3600; // 1 hour

    constructor() {
        this.redis = new Redis(
            process.env.REDIS_URL || "redis://localhost:6379",
        );

        this.redis.on("connect", () => console.log("Redis connected"));
        this.redis.on("error", (err) => console.error("Redis error:", err));
    }

    async setUserSession(userId: string, session: UserSession): Promise<void> {
        const key = `session:${userId}`;
        await this.redis.setex(key, this.SESSION_TTL, JSON.stringify(session));
    }

    async getUserSession(userId: string): Promise<UserSession | null> {
        const data = await this.redis.get(`session:${userId}`);
        return data ? JSON.parse(data) : null;
    }

    async removeUserSession(userId: string): Promise<void> {
        await this.redis.del(`session:${userId}`);
    }

    async disconnect(): Promise<void> {
        await this.redis.quit();
    }
}

let sessionManagerInstance: SessionManager | null = null;

export function getSessionManager(): SessionManager {
    if (!sessionManagerInstance) {
        sessionManagerInstance = new SessionManager();
    }
    return sessionManagerInstance;
}

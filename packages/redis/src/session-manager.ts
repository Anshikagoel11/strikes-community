import Redis from "ioredis";

export interface UserSession {
    userId: string;
    serverId?: string;
    socketId: string;
    connectedAt: number;
    lastSeen: number;
}

export interface ChannelSubscription {
    channelId: string;
    members: string[]; // userIds
}

export class SessionManager {
    private redis: Redis;
    private readonly SESSION_TTL = 3600; // 1 hour
    private readonly PRESENCE_TTL = 300; // 5 minutes

    constructor() {
        this.redis = new Redis(
            process.env.REDIS_URL || "redis://localhost:6379",
            {
                retryStrategy: (times) => {
                    if (times > 3) {
                        console.warn(
                            "⚠️ Redis not available - session features disabled",
                        );
                        return null; // Stop retrying
                    }
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                },
                maxRetriesPerRequest: 1,
                lazyConnect: true, // Don't connect immediately
                enableOfflineQueue: false, // Don't queue commands when disconnected
            },
        );

        this.redis.on("connect", () => {
            console.log("✅ Redis connected");
        });

        this.redis.on("error", (error) => {});
    }

    async setUserSession(userId: string, session: UserSession): Promise<void> {
        try {
            const key = `session:${userId}`;
            await this.redis.setex(
                key,
                this.SESSION_TTL,
                JSON.stringify(session),
            );
            await this.updatePresence(userId);
        } catch (error) {
            return;
        }
    }

    async getUserSession(userId: string): Promise<UserSession | null> {
        try {
            const key = `session:${userId}`;
            const data = await this.redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            return null;
        }
    }

    async removeUserSession(userId: string): Promise<void> {
        await this.redis.del(`session:${userId}`);
        await this.redis.del(`presence:${userId}`);
    }

    async isUserOnline(userId: string): Promise<boolean> {
        const exists = await this.redis.exists(`session:${userId}`);
        return exists === 1;
    }

    async getOnlineUsersInServer(serverId: string): Promise<string[]> {
        const pattern = `session:*`;
        const keys = await this.redis.keys(pattern);

        const onlineUsers: string[] = [];
        for (const key of keys) {
            const sessionData = await this.redis.get(key);
            if (sessionData) {
                const session: UserSession = JSON.parse(sessionData);
                if (session.serverId === serverId) {
                    onlineUsers.push(session.userId);
                }
            }
        }
        return onlineUsers;
    }

    async updatePresence(userId: string): Promise<void> {
        const key = `presence:${userId}`;
        await this.redis.setex(key, this.PRESENCE_TTL, Date.now().toString());
    }

    async getLastSeen(userId: string): Promise<number | null> {
        const key = `presence:${userId}`;
        const timestamp = await this.redis.get(key);
        return timestamp ? parseInt(timestamp) : null;
    }

    async subscribeToChannel(channelId: string, userId: string): Promise<void> {
        const key = `channel:${channelId}:members`;
        await this.redis.sadd(key, userId);
        await this.redis.expire(key, this.SESSION_TTL);
    }

    async unsubscribeFromChannel(
        channelId: string,
        userId: string,
    ): Promise<void> {
        const key = `channel:${channelId}:members`;
        await this.redis.srem(key, userId);
    }

    async getChannelMembers(channelId: string): Promise<string[]> {
        const key = `channel:${channelId}:members`;
        return await this.redis.smembers(key);
    }

    async setSocketMapping(socketId: string, userId: string): Promise<void> {
        await this.redis.setex(`socket:${socketId}`, this.SESSION_TTL, userId);
    }

    async getUserFromSocket(socketId: string): Promise<string | null> {
        return await this.redis.get(`socket:${socketId}`);
    }

    async removeSocketMapping(socketId: string): Promise<void> {
        await this.redis.del(`socket:${socketId}`);
    }

    async getOnlineCount(): Promise<number> {
        const keys = await this.redis.keys("session:*");
        return keys.length;
    }

    async cleanup(): Promise<void> {
        const pattern = "session:*";
        const keys = await this.redis.keys(pattern);

        for (const key of keys) {
            const ttl = await this.redis.ttl(key);
            if (ttl < 0) {
                await this.redis.del(key);
            }
        }
        console.log(`🧹 Cleaned up ${keys.length} session keys`);
    }

    async disconnect(): Promise<void> {
        await this.redis.quit();
    }
}

// Singleton instance
let sessionManagerInstance: SessionManager | null = null;

export function getSessionManager(): SessionManager {
    if (!sessionManagerInstance) {
        sessionManagerInstance = new SessionManager();
    }
    return sessionManagerInstance;
}

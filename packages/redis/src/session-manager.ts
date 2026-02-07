import { Redis } from "ioredis";

export interface UserSession {
    userId: string;
    serverId?: string;
    nodeId: string;
    socketId: string;
    connectedAt: number;
    lastSeen: number;
}

export interface CallData {
    callId: string;
    callerId: string;
    callerName: string;
    callerImage: string;
    recipientId: string;
    recipientName: string;
    recipientImage: string;
    conversationId: string;
    roomName: string;
    initiatedAt: number;
    status: "ringing" | "active" | "ended";
}

export class SessionManager {
    private redis: Redis;
    private readonly SESSION_TTL = 1800; // 30 min

    constructor() {
        this.redis = new Redis(process.env.REDIS_URL!);

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

    // Call state management
    async setActiveCall(callId: string, callData: CallData): Promise<void> {
        const key = `call:${callId}`;
        await this.redis.setex(key, 300, JSON.stringify(callData)); // 5 min TTL

        // Also store user's active call reference
        await this.redis.setex(`user-call:${callData.callerId}`, 300, callId);
        await this.redis.setex(
            `user-call:${callData.recipientId}`,
            300,
            callId,
        );
    }

    async getActiveCall(callId: string): Promise<CallData | null> {
        const data = await this.redis.get(`call:${callId}`);
        return data ? JSON.parse(data) : null;
    }

    async removeActiveCall(callId: string): Promise<void> {
        console.log(`[Redis] Removing active call: ${callId}`);
        const callData = await this.getActiveCall(callId);

        if (callData) {
            console.log(
                `[Redis] Found call data for ${callId}, cleaning up users: ${callData.callerId}, ${callData.recipientId}`,
            );
            await Promise.all([
                this.redis.del(`call:${callId}`),
                this.redis.del(`user-call:${callData.callerId}`),
                this.redis.del(`user-call:${callData.recipientId}`),
            ]);
        } else {
            console.warn(
                `[Redis] No call data found for ${callId} during removal. Cleaning up key only.`,
            );
            await this.redis.del(`call:${callId}`);
        }
    }

    async removeUserActiveCall(userId: string): Promise<void> {
        const callId = await this.redis.get(`user-call:${userId}`);
        if (callId) {
            await this.removeActiveCall(callId);
        } else {
            // Also try to delete the user-call key directly just in case
            await this.redis.del(`user-call:${userId}`);
        }
    }

    async getUserActiveCall(userId: string): Promise<CallData | null> {
        const callId = await this.redis.get(`user-call:${userId}`);
        if (!callId) return null;
        return this.getActiveCall(callId);
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

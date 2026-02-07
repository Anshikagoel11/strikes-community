import { Server as NetServer } from "http";
import { Server as ServerIO } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";
import { getSessionManager } from "@repo/redis";

// Kafka Consumer for Broadcasting (Scaling)
import { kafka, TOPICS } from "@repo/kafka";
import type { Consumer } from "@repo/kafka";

const PORT = parseInt(process.env.SOCKET_PORT || "3001", 10);
const REDIS_URL = process.env.REDIS_URL;

const httpServer = new NetServer((req, res) => {
    // Basic health check
    if (req.url === "/health") {
        res.writeHead(200);
        res.end("OK");
        return;
    }
    res.writeHead(404);
    res.end();
});

// Setup Redis Adapter for scaling
if (!REDIS_URL) {
    throw new Error("REDIS_URL environment variable is required");
}
const pubClient = new Redis(REDIS_URL);
const subClient = pubClient.duplicate();

const io = new ServerIO(httpServer, {
    path: "/api/socket/io",
    addTrailingSlash: false,
    cors: {
        origin: process.env.NEXT_PUBLIC_SITE_URL || "*",
        methods: ["GET", "POST"],
        credentials: true,
    },
    adapter: createAdapter(pubClient, subClient),
});

// Extend socket type to include userId
declare module "socket.io" {
    interface Socket {
        userId?: string;
    }
}

const sessionManager = getSessionManager();

// Unique ID for this server instance
const NODE_ID = crypto.randomUUID();
console.log(`Server Node ID: ${NODE_ID}`);

// Track active call timeouts
const activeCallTimeouts = new Map<string, NodeJS.Timeout>();

io.on("connection", (socket) => {
    console.log(`New connection: ${socket.id} on node ${NODE_ID}`);

    // Listen for user identification
    socket.on(
        "identify",
        async (data: { userId: string; serverId?: string }) => {
            console.log(
                `User identified: ${data.userId} → ${socket.id} on node ${NODE_ID} (Context: ${data.serverId})`,
            );
            socket.userId = data.userId; // Store userId on socket
            try {
                await sessionManager.setUserSession(data.userId, {
                    userId: data.userId,
                    serverId: data.serverId,
                    nodeId: NODE_ID,
                    socketId: socket.id,
                    connectedAt: Date.now(),
                    lastSeen: Date.now(),
                });
                console.log(`Session created: ${data.userId} → ${socket.id}`);

                // Optional: join a user-specific room
                socket.join(`user:${data.userId}`);
            } catch (error) {
                console.error("Failed to create session:", error);
            }
        },
    );

    // Join room for specific channel or conversation
    socket.on("join-channel", (channelId: string) => {
        const room = `chat:${channelId}:messages`;
        socket.join(room);
        console.log(`Socket ${socket.id} joined channel room: ${room}`);
    });

    socket.on("join-conversation", (conversationId: string) => {
        const room = `chat:${conversationId}:messages`;
        socket.join(room);
        console.log(`Socket ${socket.id} joined conversation room: ${room}`);
    });

    socket.on("leave-channel", (channelId: string) => {
        const room = `chat:${channelId}:messages`;
        socket.leave(room);
        console.log(`Socket ${socket.id} left channel room: ${room}`);
    });

    socket.on("leave-conversation", (conversationId: string) => {
        const room = `chat:${conversationId}:messages`;
        socket.leave(room);
        console.log(`Socket ${socket.id} left conversation room: ${room}`);
    });

    // Call signaling events
    socket.on(
        "call:initiate",
        async (data: {
            callerId: string;
            callerName: string;
            callerImage: string;
            recipientId: string;
            recipientName: string;
            recipientImage: string;
            conversationId: string;
            callType: "video" | "audio";
        }) => {
            try {
                console.log(
                    `Call initiated: ${data.callerId} → ${data.recipientId}`,
                );

                // Check if caller is already in a call
                const callerActiveCall = await sessionManager.getUserActiveCall(
                    data.callerId,
                );
                if (callerActiveCall) {
                    console.warn(
                        `[Socket] Initiation blocked: Caller ${data.callerId} already in call ${callerActiveCall.callId} (${callerActiveCall.status})`,
                    );
                    socket.emit("call:error", {
                        message: "You are already in a call",
                    });
                    return;
                }

                // Check if recipient is online
                const recipientSession = await sessionManager.getUserSession(
                    data.recipientId,
                );
                if (!recipientSession) {
                    socket.emit("call:user-offline", {
                        recipientId: data.recipientId,
                        recipientName: data.recipientName,
                    });
                    console.log(`Call failed: ${data.recipientId} is offline`);
                    return;
                }

                // Check if recipient is already in a call
                const recipientActiveCall =
                    await sessionManager.getUserActiveCall(data.recipientId);
                if (recipientActiveCall) {
                    socket.emit("call:user-busy", {
                        recipientId: data.recipientId,
                        recipientName: data.recipientName,
                    });
                    console.log(`Call failed: ${data.recipientId} is busy`);
                    return;
                }

                // Create call data
                const callId = crypto.randomUUID();
                const roomName = `call:${data.conversationId}:${callId}`;
                const callData = {
                    callId,
                    callerId: data.callerId,
                    callerName: data.callerName,
                    callerImage: data.callerImage,
                    recipientId: data.recipientId,
                    recipientName: data.recipientName,
                    recipientImage: data.recipientImage,
                    conversationId: data.conversationId,
                    roomName,
                    initiatedAt: Date.now(),
                    status: "ringing" as const,
                };

                // Store call in Redis
                await sessionManager.setActiveCall(callId, callData);

                // Set 30s timeout for auto-reject
                const timeout = setTimeout(async () => {
                    const currentCall =
                        await sessionManager.getActiveCall(callId);
                    if (currentCall && currentCall.status === "ringing") {
                        console.log(
                            `[Socket] Call ${callId} timed out after 30s. Auto-rejecting.`,
                        );

                        // Notify caller
                        const cSession = await sessionManager.getUserSession(
                            currentCall.callerId,
                        );
                        if (cSession) {
                            io.to(cSession.socketId).emit("call:rejected", {
                                callId,
                                recipientName: currentCall.recipientName,
                                message: "No response from user",
                            });
                        }

                        // Notify recipient
                        const rSession = await sessionManager.getUserSession(
                            currentCall.recipientId,
                        );
                        if (rSession) {
                            io.to(rSession.socketId).emit("call:cancelled", {
                                callId,
                            });
                        }

                        await sessionManager.removeActiveCall(callId);
                    }
                    activeCallTimeouts.delete(callId);
                }, 30000);

                activeCallTimeouts.set(callId, timeout);

                // Emit to recipient
                io.to(recipientSession.socketId).emit("call:incoming", {
                    callId,
                    callerId: data.callerId,
                    callerName: data.callerName,
                    callerImage: data.callerImage,
                    conversationId: data.conversationId,
                    callType: data.callType,
                    initiatedAt: callData.initiatedAt,
                });

                // Confirm to caller
                socket.emit("call:ringing", {
                    callId,
                    recipientId: data.recipientId,
                    recipientName: data.recipientName,
                    initiatedAt: callData.initiatedAt,
                });

                console.log(
                    `Call ${callId} ringing: ${data.callerId} → ${data.recipientId}`,
                );
            } catch (error) {
                console.error("Error initiating call:", error);
                socket.emit("call:error", {
                    message: "Failed to initiate call",
                });
            }
        },
    );

    socket.on("call:accept", async (data: { callId: string }) => {
        try {
            // Clear timeout
            const timeout = activeCallTimeouts.get(data.callId);
            if (timeout) {
                clearTimeout(timeout);
                activeCallTimeouts.delete(data.callId);
            }

            const callData = await sessionManager.getActiveCall(data.callId);
            if (!callData) {
                socket.emit("call:error", { message: "Call not found" });
                return;
            }

            // Update call status
            callData.status = "active";
            await sessionManager.setActiveCall(data.callId, callData);

            // Get caller session
            const callerSession = await sessionManager.getUserSession(
                callData.callerId,
            );
            if (callerSession) {
                io.to(callerSession.socketId).emit("call:accepted", {
                    callId: data.callId,
                    roomName: callData.roomName,
                    conversationId: callData.conversationId,
                });
            }

            // Confirm to recipient
            socket.emit("call:accepted", {
                callId: data.callId,
                roomName: callData.roomName,
                conversationId: callData.conversationId,
            });

            console.log(`Call ${data.callId} accepted`);
        } catch (error) {
            console.error("Error accepting call:", error);
            socket.emit("call:error", { message: "Failed to accept call" });
        }
    });

    socket.on("call:reject", async (data: { callId: string }) => {
        try {
            console.log(`[Socket] Call reject: ${data.callId}`);

            // Clear timeout
            const timeout = activeCallTimeouts.get(data.callId);
            if (timeout) {
                clearTimeout(timeout);
                activeCallTimeouts.delete(data.callId);
            }

            const callData = await sessionManager.getActiveCall(data.callId);

            if (callData) {
                // Notify caller
                const callerSession = await sessionManager.getUserSession(
                    callData.callerId,
                );
                if (callerSession) {
                    io.to(callerSession.socketId).emit("call:rejected", {
                        callId: data.callId,
                        recipientName: callData.recipientName,
                    });
                }
                // Clean up call
                await sessionManager.removeActiveCall(data.callId);
            } else {
                console.warn(
                    `[Socket] Call reject failed: Call ${data.callId} not found. Attempting user-based cleanup.`,
                );
                if (socket.userId) {
                    await sessionManager.removeUserActiveCall(socket.userId);
                }
            }
            console.log(`Call ${data.callId} rejected`);
        } catch (error) {
            console.error("Error rejecting call:", error);
        }
    });

    socket.on("call:cancel", async (data: { callId: string }) => {
        try {
            console.log(`[Socket] Call cancel: ${data.callId}`);

            // Clear timeout
            const timeout = activeCallTimeouts.get(data.callId);
            if (timeout) {
                clearTimeout(timeout);
                activeCallTimeouts.delete(data.callId);
            }

            const callData = await sessionManager.getActiveCall(data.callId);

            if (callData) {
                // Notify recipient
                const recipientSession = await sessionManager.getUserSession(
                    callData.recipientId,
                );
                if (recipientSession) {
                    io.to(recipientSession.socketId).emit("call:cancelled", {
                        callId: data.callId,
                    });
                }
                // Clean up call
                await sessionManager.removeActiveCall(data.callId);
            } else {
                console.warn(
                    `[Socket] Call cancel failed: Call ${data.callId} not found. Attempting user-based cleanup.`,
                );
                if (socket.userId) {
                    await sessionManager.removeUserActiveCall(socket.userId);
                }
            }
            console.log(`Call ${data.callId} cancelled`);
        } catch (error) {
            console.error("Error cancelling call:", error);
        }
    });

    socket.on("call:end", async (data: { callId?: string }) => {
        try {
            console.log(`[Socket] Call end requested: ${data.callId}`);
            let callId = data.callId;

            // If callId is not provided, try to find it by userId
            if (!callId && socket.userId) {
                const activeCall = await sessionManager.getUserActiveCall(
                    socket.userId,
                );
                if (activeCall) {
                    callId = activeCall.callId;
                    console.log(
                        `[Socket] Found callId ${callId} for user ${socket.userId}`,
                    );
                }
            }

            if (!callId) {
                console.warn(`[Socket] Call end failed: No callId found.`);
                return;
            }

            // Clear timeout just in case it's still there
            const timeout = activeCallTimeouts.get(callId);
            if (timeout) {
                clearTimeout(timeout);
                activeCallTimeouts.delete(callId);
            }

            const callData = await sessionManager.getActiveCall(callId);
            if (!callData) {
                console.warn(
                    `[Socket] Call end: Data for ${callId} missing. Cleaning up orphaned state.`,
                );
                await sessionManager.removeActiveCall(callId);
                return;
            }

            // Notify both parties
            const callerSession = await sessionManager.getUserSession(
                callData.callerId,
            );
            if (callerSession) {
                io.to(callerSession.socketId).emit("call:ended", { callId });
            }

            const recipientSession = await sessionManager.getUserSession(
                callData.recipientId,
            );
            if (recipientSession) {
                io.to(recipientSession.socketId).emit("call:ended", { callId });
            }

            // Clean up call
            await sessionManager.removeActiveCall(callId);
            console.log(`Call ${callId} ended`);
        } catch (error) {
            console.error("Error ending call:", error);
        }
    });

    // Handle disconnection
    socket.on("disconnect", async () => {
        console.log(`Disconnected: ${socket.id} (User: ${socket.userId})`);
        if (socket.userId) {
            try {
                // If user was in a call, we might need to clear timeout
                const activeCall = await sessionManager.getUserActiveCall(
                    socket.userId,
                );
                if (activeCall) {
                    const timeout = activeCallTimeouts.get(activeCall.callId);
                    if (timeout) {
                        clearTimeout(timeout);
                        activeCallTimeouts.delete(activeCall.callId);
                    }
                }

                // Automatically end call if user disconnects
                await sessionManager.removeUserActiveCall(socket.userId);
            } catch (error) {
                console.error("Error cleaning up call on disconnect:", error);
            }
        }
    });
});

httpServer.listen(PORT, () => {
    console.log(`Socket server running on port ${PORT}`);
});

let consumer: Consumer | null = null;

async function startConsumer() {
    consumer = kafka.consumer({
        groupId:
            "socket-server-broadcaster-" +
            Math.random().toString(36).substring(7),
    });
    await consumer.connect();
    await consumer.subscribe({ topics: [TOPICS.MESSAGES] });

    await consumer.run({
        eachMessage: async ({ topic, message }: any) => {
            try {
                const data = JSON.parse(message.value!.toString());
                const roomKey = data.channelId
                    ? `chat:${data.channelId}:messages`
                    : `chat:${data.conversationId}:messages`;

                // Emit ONLY to the specific room
                io.to(roomKey).emit(roomKey, data);
                console.log(`Broadcasted message to room: ${roomKey}`);
            } catch (e) {
                console.error("Socket broadcast error", e);
            }
        },
    });
}
startConsumer();

// Graceful shutdown
const shutdown = async () => {
    console.log("Shutting down...");

    if (consumer) {
        console.log("Disconnecting Kafka consumer...");
        await consumer.disconnect();
    }

    io.close(() => {
        httpServer.close(() => {
            pubClient.quit();
            subClient.quit();
            process.exit(0);
        });
    });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

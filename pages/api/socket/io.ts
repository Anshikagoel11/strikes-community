import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";
import { getSessionManager } from "@/lib/redis/session-manager";
import { NextApiResponseServerIo } from "@/types/types";

export const config = {
    api: {
        bodyParser: false,
    },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIo) => {
    if (!res.socket.server.io) {
        const path = "/api/socket/io";
        const httpServer: NetServer = res.socket.server as unknown as NetServer;
        const io = new ServerIO(httpServer, {
            path: path,
            addTrailingSlash: false,
        });

        const sessionManager = getSessionManager();

        // Handle connection and session tracking
        io.on("connection", (socket) => {
            // Listen for user identification
            socket.on(
                "identify",
                async (data: { userId: string; serverId?: string }) => {
                    try {
                        await sessionManager.setUserSession(data.userId, {
                            userId: data.userId,
                            serverId: data.serverId,
                            socketId: socket.id,
                            connectedAt: Date.now(),
                            lastSeen: Date.now(),
                        });
                        console.log(
                            `✅ Session created: ${data.userId} → ${socket.id}`,
                        );
                    } catch (error) {
                        console.error("❌ Failed to create session:", error);
                    }
                },
            );

            // Handle disconnection
            socket.on("disconnect", async () => {
                // Note: We don't know userId here unless we track it
                // For now, sessions will expire via TTL
            });
        });

        res.socket.server.io = io;
    }
    res.end();
};

export default ioHandler;

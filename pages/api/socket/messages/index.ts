import { CurrentProfilePages } from "@/lib/current-profile-pages";
import { prisma } from "@/lib/prisma";
import type { Server as SocketServer } from "socket.io";
import { NextApiRequest, NextApiResponse } from "next";
import { getProducer } from "@/lib/kafka/producer";
import { getSessionManager } from "@/lib/redis/session-manager";
import { v4 as uuidv4 } from "uuid";

type NextApiResponseWithSocket = NextApiResponse & {
    socket: {
        server: {
            io?: SocketServer;
        };
    };
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponseWithSocket,
) {
    if (req.method != "POST") {
        return res.status(405).json({ error: "method not allowed" });
    }
    try {
        const profile = await CurrentProfilePages(req);
        const { content, fileUrl } = req.body;

        const { serverId, channelId } = req.query;
        if (!profile) {
            return res.status(401).json({ message: "unauthorized" });
        }
        if (!serverId) {
            return res.status(401).json({ message: "server id is missing" });
        }
        if (!channelId) {
            return res.status(401).json({ message: "channel id is missing" });
        }
        const server = await prisma.server.findFirst({
            where: {
                id: serverId as string,
                members: {
                    some: {
                        profileId: profile.id,
                    },
                },
            },
            include: {
                members: true,
            },
        });
        if (!server) {
            return res.status(404).json({ message: "server not found!" });
        }
        const channel = await prisma.channel.findFirst({
            where: {
                id: channelId as string,
                serverId: serverId as string,
            },
        });
        if (!channel) {
            return res.status(404).json({ message: "channel is not found" });
        }

        const member = server.members.find(
            (member) => member.profileId === profile.id,
        );
        if (!member) {
            return res.status(404).json({ message: "member not found" });
        }

        // Generate message ID upfront
        const messageId = uuidv4();
        const timestamp = Date.now();

        // Publish to Kafka (fire-and-forget for low latency)
        // Consumer will handle database persistence in batches
        const producer = getProducer();
        producer
            .publishMessage({
                id: messageId,
                content,
                fileUrl,
                channelId: channelId as string,
                memberId: member.id,
                serverId: serverId as string,
                timestamp,
            })
            .catch((error) => {
                console.error("⚠️ Kafka publish failed (non-blocking):", error);
                // Don't fail the request - message will still be emitted via Socket.io
            });

        // Emit to Socket.io for real-time delivery (only to online users)
        const messageForEmit = {
            id: messageId,
            content,
            fileUrl,
            channelId: channelId as string,
            memberId: member.id,
            createdAt: new Date(timestamp),
            updatedAt: new Date(timestamp),
            deleted: false,
            member: {
                id: member.id,
                role: member.role,
                profileId: member.profileId,
                serverId: member.serverId,
                profile: {
                    id: profile.id,
                    userId: profile.userId,
                    name: profile.name,
                    imageUrl: profile.imageUrl,
                    email: profile.email,
                },
            },
        };

        const channelKey = `chat:${channelId}:messages`;
        const sessionManager = getSessionManager();

        // Get all members in this server and check who's online
        for (const serverMember of server.members) {
            try {
                const memberProfile = await prisma.profile.findUnique({
                    where: { id: serverMember.profileId },
                });

                if (memberProfile) {
                    const session = await sessionManager.getUserSession(
                        memberProfile.userId,
                    );
                    if (session && session.socketId) {
                        // User is online - emit to their specific socket
                        res?.socket?.server?.io
                            ?.to(session.socketId)
                            .emit(channelKey, messageForEmit);
                    }
                }
            } catch (error) {
                // Skip if Redis is unavailable or profile not found
                continue;
            }
        }

        return res.status(200).json(messageForEmit);
    } catch (error) {
        console.log("messages_post", error);
        return res.status(500).json({ message: "internal server error" });
    }
}

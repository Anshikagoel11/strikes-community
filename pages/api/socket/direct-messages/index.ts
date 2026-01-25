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

        const { conversationId } = req.query;
        if (!profile) {
            return res.status(401).json({ message: "unauthorized" });
        }
        if (!conversationId) {
            return res
                .status(401)
                .json({ message: "conversation id is missing" });
        }

        const conversation = await prisma.conversation.findFirst({
            where: {
                id: conversationId as string,
                OR: [
                    {
                        memberOne: {
                            profileId: profile.id,
                        },
                    },
                    {
                        memberTwo: {
                            profileId: profile.id,
                        },
                    },
                ],
            },
            include: {
                memberOne: {
                    include: {
                        profile: true,
                    },
                },
                memberTwo: {
                    include: {
                        profile: true,
                    },
                },
            },
        });

        if (!conversation) {
            return res.status(404).json({ message: "conversation not found" });
        }

        const member =
            conversation.memberOne.profileId === profile.id
                ? conversation.memberOne
                : conversation.memberTwo;

        if (!member) {
            return res.status(404).json({ message: "member not found" });
        }

        // Generate message ID upfront
        const messageId = uuidv4();
        const timestamp = Date.now();

        // Publish to Kafka (fire-and-forget for low latency)
        const producer = getProducer();
        producer
            .publishMessage({
                id: messageId,
                content,
                fileUrl,
                conversationId: conversationId as string,
                memberId: member.id,
                timestamp,
            })
            .catch((error) => {
                console.error("⚠️ Kafka publish failed (non-blocking):", error);
                // Don't fail the request - message will still be emitted via Socket.io
            });

        // Immediately emit to Socket.io for real-time delivery
        const messageForEmit = {
            id: messageId,
            content,
            fileUrl,
            conversationId: conversationId as string,
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

        const channelKey = `chat:${conversationId}:messages`;
        const sessionManager = getSessionManager();

        // Find the recipient (the other person in the conversation)
        const recipient =
            conversation.memberOne.profileId === profile.id
                ? conversation.memberTwo
                : conversation.memberOne;

        // Emit to both sender and recipient
        try {
            // Emit to sender (current user)
            const senderSession = await sessionManager.getUserSession(
                profile.userId,
            );
            if (senderSession && senderSession.socketId) {
                res?.socket?.server?.io
                    ?.to(senderSession.socketId)
                    .emit(channelKey, messageForEmit);
            }

            // Emit to recipient
            const recipientSession = await sessionManager.getUserSession(
                recipient.profile.userId,
            );
            if (recipientSession && recipientSession.socketId) {
                res?.socket?.server?.io
                    ?.to(recipientSession.socketId)
                    .emit(channelKey, messageForEmit);
            }
        } catch (error) {
            console.error("⚠️ Redis check failed:", error);
        }

        return res.status(200).json(messageForEmit);
    } catch (error) {
        console.log("direct_messages_post", error);
        return res.status(500).json({ message: "internal server error" });
    }
}

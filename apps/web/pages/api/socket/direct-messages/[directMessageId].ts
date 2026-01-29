import { NextApiRequest } from "next";
import { NextApiResponseServerIo } from "@/types/types";
import { CurrentProfilePages } from "@/lib/current-profile-pages";
import { prisma } from "@repo/db";
import { MemberRole } from "@repo/db";
import { getSessionManager } from "@repo/redis";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponseServerIo,
) {
    try {
        if (req.method !== "DELETE" && req.method !== "PATCH") {
            return res.status(405).json({ error: "Method not allowed" });
        }

        const profile = await CurrentProfilePages(req);
        const { directMessageId, conversationId } = req.query;
        const { content } = req.body;

        if (!profile) {
            return res.status(400).json({ message: "unauthorized" });
        }

        if (!conversationId) {
            return res.status(401).json({ message: "conversation id missing" });
        }

        if (!directMessageId) {
            return res
                .status(401)
                .json({ message: "direct message id missing" });
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
            return res.status(400).json({ message: "conversation not found" });
        }

        const member =
            conversation.memberOne.profileId === profile.id
                ? conversation.memberOne
                : conversation.memberTwo;

        if (!member) {
            return res.status(400).json({ message: "member not found" });
        }

        let directMessage = await prisma.directMessage.findFirst({
            where: {
                id: directMessageId as string,
                conversationId: conversationId as string,
            },
            include: {
                member: {
                    include: {
                        profile: true,
                    },
                },
            },
        });

        if (!directMessage || directMessage.deleted) {
            return res.status(404).json({ message: "message not found" });
        }

        const isMessageOwner = directMessage.memberId === member.id;
        const isAdmin = member.role === MemberRole.ADMIN;
        const isModerator = member.role === MemberRole.MODERATOR;
        const canModify = isMessageOwner || isAdmin || isModerator;

        if (!canModify) {
            return res.status(401).json({ message: "unauthorized" });
        }
        if (req.method === "DELETE") {
            directMessage = await prisma.directMessage.update({
                where: {
                    id: directMessageId as string,
                },
                data: {
                    fileUrl: null,
                    content: "This message has been deleted",
                    deleted: true,
                },
                include: {
                    member: {
                        include: {
                            profile: true,
                        },
                    },
                },
            });
        }
        if (req.method === "PATCH") {
            if (!isMessageOwner) {
                return res.status(401).json({ error: "unauthorized" });
            }
            directMessage = await prisma.directMessage.update({
                where: {
                    id: directMessageId as string,
                },
                data: {
                    content: content,
                },
                include: {
                    member: {
                        include: {
                            profile: true,
                        },
                    },
                },
            });
        }
        const updateKey = `chat:${conversation.id}:messages:update`;
        const sessionManager = getSessionManager();

        // Find the recipient (the other person in the conversation)
        const recipient =
            conversation.memberOne.profileId === profile.id
                ? conversation.memberTwo
                : conversation.memberOne;

        // Emit only to recipient if they're online
        try {
            const recipientSession = await sessionManager.getUserSession(
                recipient.profile.userId,
            );
            if (recipientSession && recipientSession.socketId) {
                res?.socket?.server?.io
                    ?.to(recipientSession.socketId)
                    .emit(updateKey, directMessage);
            }
        } catch {
            // Redis unavailable - skip
        }

        return res.status(200).json(directMessage);
    } catch (error) {
        console.log("message_error", error);
        return res.status(500).json({ error: "internal server error" });
    }
}

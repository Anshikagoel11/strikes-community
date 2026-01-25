import { NextApiRequest } from "next";
import { NextApiResponseServerIo } from "@/types/types";
import { CurrentProfilePages } from "@/lib/current-profile-pages";
import { prisma } from "@/lib/prisma";
import { MemberRole } from "@/lib/generated/prisma/enums";
import { getSessionManager } from "@/lib/redis/session-manager";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponseServerIo,
) {
    try {
        if (req.method !== "DELETE" && req.method !== "PATCH") {
            return res.status(405).json({ error: "Method not allowed" });
        }

        const profile = await CurrentProfilePages(req);
        const { messageId, serverId, channelId } = req.query;
        const { content } = req.body;

        if (!profile) {
            return res.status(400).json({ message: "unauthorized" });
        }

        if (!serverId) {
            return res.status(401).json({ message: "server id missing" });
        }

        if (!channelId) {
            return res.status(401).json({ message: "channel id missing" });
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
            return res.status(400).json({ message: "server is not found" });
        }

        const channel = await prisma.channel.findFirst({
            where: {
                id: channelId as string,
                serverId: serverId as string,
            },
        });

        if (!channel) {
            return res.status(400).json({ message: "channel not found" });
        }

        const member = server.members.find(
            (member) => member.profileId === profile.id,
        );
        if (!member) {
            return res.status(400).json({ message: "member not found" });
        }

        let message = await prisma.message.findFirst({
            where: {
                id: messageId as string,
                channelId: channelId as string,
            },
            include: {
                member: {
                    include: {
                        profile: true,
                    },
                },
            },
        });

        if (!message || message.deleted) {
            return res.status(404).json({ message: "message not found" });
        }

        const isMessageOwner = message.memberId === member.id;
        const isAdmin = member.role === MemberRole.ADMIN;
        const isModerator = member.role === MemberRole.MODERATOR;
        const canModify = isMessageOwner || isAdmin || isModerator;

        if (!canModify) {
            return res.status(401).json({ message: "unauthorized" });
        }
        if (req.method === "DELETE") {
            message = await prisma.message.update({
                where: {
                    id: messageId as string,
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
            message = await prisma.message.update({
                where: {
                    id: messageId as string,
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
        const updateKey = `chat:${channelId}:messages:update`;
        const sessionManager = getSessionManager();

        // Emit to online users in this channel
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
                        res?.socket?.server?.io
                            ?.to(session.socketId)
                            .emit(updateKey, message);
                    }
                }
            } catch (error) {
                continue;
            }
        }

        return res.status(200).json(message);
    } catch (error) {
        console.log("message_error", error);
        return res.status(500).json({ error: "internal server error" });
    }
}

import { CurrentProfilePages } from "@/lib/current-profile-pages";
import { prisma } from "@/lib/prisma";
import type { Server as SocketServer } from "socket.io";
import { NextApiRequest, NextApiResponse } from "next";

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
        const message = await prisma.directMessage.create({
            data: {
                content,
                fileUrl,
                conversationId: conversationId as string,
                memberId: member.id,
            },
            include: {
                member: {
                    include: {
                        profile: true,
                    },
                },
            },
        });
        const channelKey = `chat:${conversationId}:messages`;
        res?.socket?.server?.io?.emit(channelKey, message);
        return res.status(200).json(message);
    } catch (error) {
        console.log("direct_messages_post", error);
        return res.status(500).json({ message: "internal server error" });
    }
}

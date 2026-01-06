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
    res: NextApiResponseWithSocket
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
            (member) => member.profileId === profile.id
        );
        if (!member) {
            return res.status(404).json({ message: "member not found" });
        }
        const message = await prisma.message.create({
            data: {
                content,
                fileUrl,
                channelId: channelId as string,
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
        const channelKey = `chat:${channelId}:messages`;
        res?.socket?.server?.io?.emit(channelKey, message); 
        return res.status(200).json(message);
    } catch (error) {
        console.log("messages_post", error);
        return res.status(500).json({ message: "internal server error" });
    }
}

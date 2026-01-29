import { CurrentProfile } from "@/lib/current-profile";
import { NextResponse } from "next/server";
import { Message } from "@repo/db";
import { prisma } from "@repo/db";

const MESSAGE_BATCH = 10;

export async function GET(req: Request) {
    try {
        const profile = await CurrentProfile();
        const { searchParams } = new URL(req.url);
        const cursor = searchParams.get("cursor");
        const channelId = searchParams.get("channelId");

        if (!profile) {
            return new NextResponse("unauthorized", { status: 400 });
        }

        if (!channelId) {
            return new NextResponse("channel id is missing", { status: 401 });
        }
        let messages: Message[] = [];

        if (cursor) {
            messages = await prisma.message.findMany({
                take: MESSAGE_BATCH,
                skip: 1,
                cursor: {
                    id: cursor,
                },
                where: {
                    channelId,
                },
                include: {
                    member: {
                        include: {
                            profile: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            });
        } else {
            messages = await prisma.message.findMany({
                take: MESSAGE_BATCH,
                where: {
                    channelId,
                },
                include: {
                    member: {
                        include: {
                            profile: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            });
        }
        let nextCursor = null;
        if (messages.length === MESSAGE_BATCH) {
            nextCursor = messages[MESSAGE_BATCH - 1].id;
        }
        return NextResponse.json({
            items: messages,
            nextCursor,
        });
    } catch (error) {
        console.log("message_error", error);
        return new NextResponse("internal server error", { status: 500 });
    }
}

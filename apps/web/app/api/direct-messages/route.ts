import { CurrentProfile } from "@/lib/current-profile";
import { NextResponse } from "next/server";
import { DirectMessage } from "@repo/db";
import { prisma } from "@repo/db";

const MESSAGE_BATCH = 10;

export async function GET(req: Request) {
    try {
        const profile = await CurrentProfile();
        const { searchParams } = new URL(req.url);
        const cursor = searchParams.get("cursor");
        const conversationId = searchParams.get("conversationId");

        if (!profile) {
            return new NextResponse("unauthorized", { status: 400 });
        }

        if (!conversationId) {
            return new NextResponse("conversation id is missing", {
                status: 401,
            });
        }
        let messages: DirectMessage[] = [];

        if (cursor) {
            messages = await prisma.directMessage.findMany({
                take: MESSAGE_BATCH,
                skip: 1,
                cursor: {
                    id: cursor,
                },
                where: {
                    conversationId,
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
            messages = await prisma.directMessage.findMany({
                take: MESSAGE_BATCH,
                where: {
                    conversationId,
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
        console.log("direct_messages_error", error);
        return new NextResponse("internal server error", { status: 500 });
    }
}

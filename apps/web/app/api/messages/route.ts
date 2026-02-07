import { CurrentProfile } from "@/lib/current-profile";
import { NextResponse } from "next/server";
import { Message } from "@repo/db";
import { prisma } from "@repo/db";

import { getMessageCache } from "@repo/redis";

const MESSAGE_BATCH = 10;
const messageCache = getMessageCache();

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

        // Cache key format: chat:channelId:messages:cursor
        const cacheKey = `chat:${channelId}:messages:${cursor || "initial"}`;

        // Try to get from cache first
        const cachedMessages = await messageCache.getMessages(cacheKey);
        if (cachedMessages) {
            console.log(`[API] Cache hit for ${cacheKey}`);
            return NextResponse.json({
                items: cachedMessages,
                nextCursor:
                    cachedMessages.length === MESSAGE_BATCH
                        ? cachedMessages[MESSAGE_BATCH - 1].id
                        : null,
            });
        }

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

        // Store in cache
        await messageCache.addMessages(cacheKey, messages);

        return NextResponse.json({
            items: messages,
            nextCursor,
        });
    } catch (error) {
        console.log("message_error", error);
        return new NextResponse("internal server error", { status: 500 });
    }
}

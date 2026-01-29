import { CurrentProfile } from "@/lib/current-profile";
import { MemberRole } from "@repo/db";
import { prisma } from "@repo/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const profile = await CurrentProfile();
        const { name, type } = await req.json();
        const { searchParams } = new URL(req.url);

        const serverId = searchParams.get("serverId");
        if (!profile) return new NextResponse("unauthorized", { status: 401 });
        if (!serverId)
            return new NextResponse("serverId is missing", { status: 400 });
        if (name === "general") {
            return new NextResponse("channel name cannot be general", {
                status: 401,
            });
        }
        const server = await prisma.server.update({
            where: {
                id: serverId,
                members: {
                    some: {
                        profileId: profile.id,
                        role: {
                            in: [MemberRole.ADMIN, MemberRole.MODERATOR],
                        },
                    },
                },
            },
            data: {
                channels: {
                    create: {
                        profileId: profile.id,
                        name,
                        type,
                    },
                },
            },
        });
        return NextResponse.json(server);
    } catch (error) {
        console.log("CHANNEL_CREATE", error);
        return new NextResponse("internal server error", { status: 500 });
    }
}

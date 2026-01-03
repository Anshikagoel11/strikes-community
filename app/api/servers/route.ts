import { CurrentProfile } from "@/lib/current-profile";
import { MemberRole } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
    try {
        const { name, imageUrl } = await req.json();
        const profile = await CurrentProfile();
        if (!profile) {
            return new NextResponse("unauthorized", { status: 401 });
        }
        const server = await prisma.server.create({
            data: {
                profileId: profile.id,
                name,
                imageUrl,
                inviteCode: uuidv4(),
                channels: {
                    create: [{ name: "general", profileId: profile.id }],
                },
                members: {
                    create: [{ profileId: profile.id, role: MemberRole.ADMIN }],
                },
            },
        });
        return NextResponse.json(server);
    } catch (error) {
        console.log("unable to create server", error);
        return new NextResponse("Interval server error", { status: 500 });
    }
}

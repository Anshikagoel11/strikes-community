import { CurrentProfile } from "@/lib/current-profile";
import { NextResponse } from "next/server";
import { getSessionManager } from "@repo/redis";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ userId: string }> },
) {
    try {
        const profile = await CurrentProfile();

        if (!profile) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { userId } = await params;

        if (!userId) {
            return new NextResponse("User ID missing", { status: 400 });
        }

        const sessionManager = getSessionManager();
        const session = await sessionManager.getUserSession(userId);

        return NextResponse.json({
            isLive: !!session,
        });
    } catch (error) {
        console.error("[USER_STATUS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

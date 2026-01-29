import { CurrentProfile } from "@/lib/current-profile";
import { prisma } from "@repo/db";
import { redirect } from "next/navigation";

const InviteCodePage = async ({
    params,
}: {
    params: Promise<{ InviteCode: string }>;
}) => {
    const { InviteCode } = await params;

    if (!InviteCode) {
        return redirect("/");
    }
    const profile = await CurrentProfile();
    if (!profile) {
        return redirect("/sign-in");
    }

    const existingServer = await prisma.server.findFirst({
        where: {
            inviteCode: InviteCode,
            members: {
                some: {
                    profileId: profile.id,
                },
            },
        },
    });
    if (existingServer) {
        return redirect(`/servers/${existingServer.id}`);
    }

    // join the server
    const server = await prisma.server.update({
        where: {
            inviteCode: InviteCode,
        },
        data: {
            members: {
                create: [{ profileId: profile.id }],
            },
        },
    });

    if (server) {
        return redirect(`/servers/${server.id}`);
    }
};

export default InviteCodePage;

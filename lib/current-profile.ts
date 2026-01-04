import { auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export const CurrentProfile = async () => {
    const { userId } = await auth();

    if (!userId) {
        return null;
    }
    const profile = prisma.profile.findUnique({
        where: {
            userId,
        },
    });

    return profile;
};

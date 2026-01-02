import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const initialProfile = async () => {
    const user = await currentUser();

    if (!user) {
        return redirect("/sign-in");
    }

    const profile = await prisma.profile.findUnique({
        where: {
            userId: user.id,
        },
    });

    if (profile) {
        return profile;
    }

    const newProfile = await prisma.profile.create({
        data: {
            userId: user.id,
            email: user.emailAddresses[0].emailAddress,
            name: `${user.firstName} ${user.lastName}`,
            imageUrl: user.imageUrl,
        },
    });

    return newProfile;
};

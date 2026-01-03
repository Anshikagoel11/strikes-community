import { Member, Profile, Server } from "@/lib/generated/prisma/client";

export type ServerWithMembersWithProfile = Server & {
    members: (Member & { profile: Profile })[];
};

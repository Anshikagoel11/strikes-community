import { CurrentProfile } from '@/lib/current-profile';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

const ServerPage = async ({ params }: { params: Promise<{ serverId: string }> }) => {
    const { serverId } = await params;

    const profile = await CurrentProfile();
    if (!profile) {
        return redirect("/sign-in")
    }

    const server = await prisma.server.findUnique({
        where: {
            id: serverId
        },
        include: {
            channels: {
                orderBy: {
                    createdAt: "asc"
                }
            },
            members: {
                include: {
                    profile: true
                },
                orderBy: {
                    role: "asc"
                }
            }
        }
    })
    if (!server) {
        return redirect("/sign-in")
    }

    return (
        <div className='h-full w-full flex justify-center items-center flex-col'>
            <h1>{`Server Id: ${serverId}`}</h1>
            <h2>{`Server Name: ${server.name}`}</h2>
        </div>
    )
}

export default ServerPage
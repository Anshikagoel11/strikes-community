import { CurrentProfile } from '@/lib/current-profile'
import React from 'react'
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ChannelType } from '@/lib/generated/prisma/enums';
import ServerHeader from './server-header';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const ServerSidebar = async ({ serverId }: { serverId: string }) => {
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
    const textChannels = server?.channels.filter((channel) => channel.type === ChannelType.TEXT)
    const audioChannels = server?.channels.filter((channel) => channel.type === ChannelType.AUDIO)
    const videoChannels = server?.channels.filter((channel) => channel.type === ChannelType.VIDEO)
    const members = server?.members.filter((user) => user.profileId !== profile.id)
    if (!server) {
        return redirect("/sign-in")
    }
    const role = server.members.find((user) => user.profileId === profile.id)?.role;
    return (
        <div className='flex flex-col h-full text-primary w-full bg-muted'>
            <ServerHeader server={server} role={role} />
            
            <ScrollArea className='flex-1 px-3'>
                <div className='mt-2'>
                    {textChannels?.length > 0 && (
                        <div className='mb-2'>
                            <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1'>
                                Text Channels
                            </h3>
                            {textChannels.map((channel) => (
                                <div key={channel.id} className='flex items-center px-2 py-1 rounded-md hover:bg-accent cursor-pointer'>
                                    <span className='text-sm'># {channel.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {audioChannels?.length > 0 && (
                        <div className='mb-2'>
                            <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1'>
                                Voice Channels
                            </h3>
                            {audioChannels.map((channel) => (
                                <div key={channel.id} className='flex items-center px-2 py-1 rounded-md hover:bg-accent cursor-pointer'>
                                    <span className='text-sm'>🔊 {channel.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {videoChannels?.length > 0 && (
                        <div className='mb-2'>
                            <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1'>
                                Video Channels
                            </h3>
                            {videoChannels.map((channel) => (
                                <div key={channel.id} className='flex items-center px-2 py-1 rounded-md hover:bg-accent cursor-pointer'>
                                    <span className='text-sm'>📹 {channel.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <Separator className='my-2' />
                <div>
                    <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1'>
                        Members - {server.members.length}
                    </h3>
                    {server.members.map((member) => (
                        <div key={member.id} className='flex items-center px-2 py-1 rounded-md hover:bg-accent cursor-pointer'>
                            <div className='w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold mr-2'>
                                {member.profile.name.charAt(0).toUpperCase()}
                            </div>
                            <span className='text-sm'>{member.profile.name}</span>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}

export default ServerSidebar
import { CurrentProfile } from '@/lib/current-profile'
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ChannelType } from '@/lib/generated/prisma/enums';
import ServerHeader from './server-header';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { HashIcon, TvMinimalPlay, Volume2 } from 'lucide-react';

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
    if (!server) {
        return redirect("/sign-in")
    }

    const textChannels = server.channels.filter((channel) => channel.type === ChannelType.TEXT)
    const audioChannels = server.channels.filter((channel) => channel.type === ChannelType.AUDIO)
    const videoChannels = server.channels.filter((channel) => channel.type === ChannelType.VIDEO)
    const role = server.members.find((user) => user.profileId === profile.id)?.role;
    return (
        <div className='flex flex-col h-full text-primary w-full bg-muted'>
            <ServerHeader server={server} role={role} />

            <Separator className='mb-2' />

            <ScrollArea className='flex-1 px-3'>
                <div className='mt-2'>
                    {textChannels.length > 0 && (
                        <div className='mb-3'>
                            <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2'>
                                <HashIcon className='h-4 w-4' />
                                Text Channels
                            </h3>
                            {textChannels.map((channel) => (
                                <div key={channel.id} role="button" tabIndex={0} className='flex items-center px-2 py-1 rounded-md hover:bg-accent cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
                                    <span className='text-sm flex gap-2 items-center'><HashIcon className='h-4 w-4 text-muted-foreground' /> {channel.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {audioChannels.length > 0 && (
                        <div className='mb-3'>
                            <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2'>
                                <Volume2 className='h-4 w-4' />
                                Voice Channels
                            </h3>
                            {audioChannels.map((channel) => (
                                <div key={channel.id} role="button" tabIndex={0} className='flex items-center px-2 py-1 rounded-md hover:bg-accent cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
                                    <span className='text-sm flex gap-2 items-center'><Volume2 className='h-4 w-4 text-muted-foreground' />{channel.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {videoChannels.length > 0 && (
                        <div className='mb-3'>
                            <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2'>
                                <TvMinimalPlay className='h-4 w-4' />
                                Video Channels
                            </h3>
                            {videoChannels.map((channel) => (
                                <div key={channel.id} role="button" tabIndex={0} className='flex items-center px-2 py-1 rounded-md hover:bg-accent cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
                                    <span className='text-sm flex gap-2 items-center'><TvMinimalPlay className='h-4 w-4 text-muted-foreground' /> {channel.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {/* <Separator className='my-2 mx-3' />
                <div>
                    <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2'>
                        Members <span className='text-muted-foreground text-xs ml-1'>- {server.members.length}</span>
                    </h3>
                    {server.members.map((member) => (
                        <div key={member.id} className='flex items-center px-2 py-1 rounded-md hover:bg-accent cursor-pointer'>
                            <div title={member.profile.name} className='w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold mr-2'>
                                {member.profile.name.charAt(0).toUpperCase()}
                            </div>
                            <span className='text-sm'>{member.profile.name}</span>
                        </div>
                    ))}
                </div> */}
            </ScrollArea>
        </div>
    )
}

export default ServerSidebar
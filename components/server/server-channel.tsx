"use client"
import React from 'react'
import { HashIcon, Volume2, TvMinimalPlay, Edit, Trash, Lock } from 'lucide-react'
import { ChannelType, MemberRole } from '@/lib/generated/prisma/enums'
import type { Channel, Server } from '@/lib/generated/prisma/client'
import { useParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import ActionTooltip from '../action-tooltip'
import { useModal } from '@/hooks/use-mode-store'

interface ServerChannelProps {
    channel: Channel,
    server: Server,
    role?: MemberRole
}

const iconMap: Record<ChannelType, React.ReactNode> = {
    [ChannelType.TEXT]: <HashIcon className='h-4 w-4 text-muted-foreground mr-2' />,
    [ChannelType.AUDIO]: <Volume2 className='h-4 w-4 text-muted-foreground mr-2' />,
    [ChannelType.VIDEO]: <TvMinimalPlay className='h-4 w-4 text-muted-foreground mr-2' />
}

const ServerChannel = ({ channel, server, role }: ServerChannelProps) => {
    const params = useParams()
    const router = useRouter()
    const isActive = params?.channelId === channel.id
    const { onOpen } = useModal()

    const onClick = () => {
        const sid = params?.serverId ?? server?.id
        router.push(`/servers/${sid}/channels/${channel.id}`)
    }

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick()
        }
    }

    return (
        <div
            role="button"
            tabIndex={0}
            aria-current={isActive ? "true" : undefined}
            onClick={onClick}
            onKeyDown={onKeyDown}
            title={channel.name}
            className={cn(
                'flex items-center px-2 py-1 rounded-md hover:bg-primary/10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring group',
                isActive && 'bg-primary/10 text-primary font-medium'
            )}
        >
            <span className='text-sm flex gap-2 items-center truncate'>{iconMap[channel.type]}{channel.name}</span>
            {channel.name !== "general" && role !== MemberRole.GUEST && (
                <div className='ml-auto flex items-center gap-x-2'>
                    <ActionTooltip label='Edit'>
                        <button
                            type='button'
                            aria-label={`Edit ${channel.name}`}
                            className='opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-150 p-1 rounded'
                            onClick={() => onOpen("editChannel", { server, channel })}
                        >
                            <Edit className='w-4 h-4' />
                        </button>
                    </ActionTooltip>
                    <ActionTooltip label='Delete'>
                        <button
                            type='button'
                            onClick={() => onOpen("deleteChannel", { server, channel })}
                            aria-label={`Delete ${channel.name}`}
                            className='opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-150 p-1 rounded text-destructive'
                        >
                            <Trash className='w-4 h-4' />
                        </button>
                    </ActionTooltip>
                </div>
            )}
            {channel.name === "general" && role !== MemberRole.GUEST && (
                <div className='ml-auto flex items-center gap-x-2'>
                    <ActionTooltip label='Locked'>
                        <span className='text-muted-foreground'><Lock className='w-4 h-4' /></span>
                    </ActionTooltip>
                </div>
            )}
        </div>
    )
}

export default ServerChannel
"use client"
import type { Member, Profile, Server } from '@/lib/generated/prisma/client'
import { ShieldAlert, ShieldCheck } from 'lucide-react'

import UserAvatar from '../user-avatar'
import { Tooltip, TooltipTrigger } from '../ui/tooltip'
import { useRouter } from 'next/navigation'

interface ServerMemberProps {
    member: Member & { profile: Profile }
    server: Server
}

const roleIconMap = {
    GUEST: null,
    MODERATOR: <ShieldCheck className='h-4 w-4' />,
    ADMIN: <ShieldAlert className='h-4 w-4 text-rose-500' />
}

const ServerMember = ({ member, server }: ServerMemberProps) => {
    const icon = roleIconMap[member.role];
    const router = useRouter()

    function openConversation() {
        router.push(`/servers/${server.id}/conversation/${member.id}/`)
    }
    return (
        <button
            type="button"
            className="group w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring text-sm text-left"
            onClick={openConversation}
        >
            <UserAvatar src={member.profile.imageUrl} />

            <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{member.profile.name}</p>
            </div>

            {icon && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="hidden group-hover:block ml-2 text-muted-foreground">{icon}</span>
                    </TooltipTrigger>
                </Tooltip>
            )}
        </button>
    )
}

export default ServerMember
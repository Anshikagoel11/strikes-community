"use client"
import { MemberRole } from '@/lib/generated/prisma/enums'
import { ServerWithMembersWithProfile } from '@/types/types'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { ChevronDown, UserPlus, Settings, Users, LogOut, PlusCircle, Trash } from 'lucide-react'
import { useModal } from '@/hooks/use-mode-store'

const ServerHeader = ({ server, role }: { server: ServerWithMembersWithProfile, role?: MemberRole }) => {
    const isAdmin = role === MemberRole.ADMIN
    const isModerator = isAdmin || role === MemberRole.MODERATOR
    const { onOpen } = useModal()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className='focus:outline-none' asChild>
                <button className='w-full text-md font-semibold px-3 flex items-center h-12 border-neutral-200 dark:border-neutral-800 border-b-2 hover:bg-accent/50 transition group'>
                    <span className='truncate'>{server.name}</span>
                    <ChevronDown className='h-5 w-5 ml-auto transition-transform group-hover:rotate-180' />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='w-56 text-xs font-medium text-black dark:text-neutral-400 space-y-0.5'>
                {isModerator && (
                    <DropdownMenuItem onClick={() => onOpen("invite", { server })} className='px-3 py-2 text-sm cursor-pointer hover:bg-accent'>
                        Invite People
                        <UserPlus className='h-4 w-4 ml-auto' />
                    </DropdownMenuItem>
                )}
                {isAdmin && (
                    <DropdownMenuItem onClick={() => onOpen("editServer", { server })} className='px-3 py-2 text-sm cursor-pointer hover:bg-accent'>
                        Server Settings
                        <Settings className='h-4 w-4 ml-auto' />
                    </DropdownMenuItem>
                )}
                {isAdmin && (
                    <DropdownMenuItem onClick={() => onOpen("members", { server })} className='px-3 py-2 text-sm cursor-pointer hover:bg-accent'>
                        Manage Members
                        <Users className='h-4 w-4 ml-auto' />
                    </DropdownMenuItem>
                )}
                {isModerator && (
                    <DropdownMenuItem onClick={() => onOpen("createChannel")} className='px-3 py-2 text-sm cursor-pointer hover:bg-accent'>
                        Create New Channel
                        <PlusCircle className='h-4 w-4 ml-auto' />
                    </DropdownMenuItem>
                )}
                {isModerator && <DropdownMenuSeparator />}
                {isAdmin && (
                    <DropdownMenuItem variant="destructive" className='px-3 py-2 text-sm cursor-pointer'>
                        Delete Server
                        <Trash className='h-4 w-4 ml-auto' />
                    </DropdownMenuItem>
                )}
                {!isAdmin && (
                    <DropdownMenuItem variant="destructive" className='px-3 py-2 text-sm cursor-pointer'>
                        Leave Server
                        <LogOut className='h-4 w-4 ml-auto' />
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default ServerHeader
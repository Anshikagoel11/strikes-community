import React from 'react'
import { redirect } from 'next/navigation'
import { CurrentProfile } from '@/lib/current-profile'
import { prisma } from '@/lib/prisma'
import NavigationAction from './navigation-action'
import { Separator } from '../ui/separator'
import { ScrollArea } from '../ui/scroll-area'
import NavigationItems from './navigation-items'
import { ModeToggle } from '../ModeToggle'
import { UserButton } from '@clerk/nextjs'

const NavigationSidebar = async () => {
    const profile = await CurrentProfile()
    if (!profile) {
        return redirect("/")
    }

    const servers = await prisma.server.findMany({
        where: {
            members: {
                some: {
                    profileId: profile.id
                }
            }
        }
    })

    return (
        <div className='space-y-4 flex flex-col items-center h-full text-primary w-full bg-secondary py-3'>
            <NavigationAction />
            <Separator
                className="bg-muted-foreground/20 rounded-md w-10 mx-auto"
            />

            <ScrollArea className='flex-1 w-full'>
                {servers.map((server) => (
                    <div key={server.id} className="mb-4">
                        <NavigationItems
                            id={server.id} name={server.name} imageUrl={server.imageUrl}
                        />
                    </div>
                ))}
            </ScrollArea>
            <Separator
                className="bg-muted-foreground/20 rounded-md w-10 mx-auto"
            />

            <div className='mt-auto flex items-center flex-col gap-y-4'>
                <ModeToggle
                />
                <UserButton />
            </div>
        </div>
    )
}

export default NavigationSidebar
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
        <nav aria-label="Server sidebar" className='flex flex-col items-center h-full text-primary bg-secondary py-3'>
            <div className='flex flex-col items-center w-full space-y-4'>
                <NavigationAction />
                <Separator className="bg-muted-foreground/20 rounded-md w-10 mx-auto mb-2" />
            </div>

            <ScrollArea className='flex-1 w-full'>
                <ul className='flex flex-col items-center gap-2 py-2'>
                    {servers.length === 0 ? (
                        <li className='text-xs text-muted-foreground px-2 text-center'>
                            No servers
                        </li>
                    ) : servers.map((server) => (
                        <li key={server.id} className="mb-0">
                            <NavigationItems id={server.id} name={server.name} imageUrl={server.imageUrl} />
                        </li>
                    ))}
                </ul>
            </ScrollArea>

            <div className='w-full'>
                <Separator className="bg-muted-foreground/20 rounded-md w-10 mx-auto" />
                <div className='mt-2 flex items-center flex-col gap-y-3'>
                    <ModeToggle />
                    <div className='w-full flex justify-center'>
                        <UserButton/>
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default NavigationSidebar
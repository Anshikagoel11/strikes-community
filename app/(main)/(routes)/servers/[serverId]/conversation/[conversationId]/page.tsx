import ChatHeader from '@/components/chat/chat-header';
import ChatInput from '@/components/chat/chat-input';
import { getOrCreateConversation } from '@/lib/conversation';
import { CurrentProfile } from '@/lib/current-profile'
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

const ConversationPage = async ({ params }: { params: Promise<{ conversationId: string, serverId: string }> }) => {
    const profile = await CurrentProfile();
    if (!profile) {
        redirect("/sign-in")
    }
    const { serverId, conversationId } = await params;
    const currentMember = await prisma.member.findFirst({
        where: {
            serverId: serverId,
            profileId: profile.id
        },
        include: {
            profile: true
        }
    })
    if (!currentMember) {
        return redirect(`/servers/${serverId}`)
    }
    const conversation = await getOrCreateConversation(currentMember.id, conversationId)
    if (!conversation) {
        return redirect(`/servers/${serverId}`)
    }
    const { memberOne, memberTwo } = conversation;
    const otherMember = memberOne.profileId === profile.id ? memberTwo : memberOne

    return (
        <div className='flex flex-col min-h-screen'>
            <ChatHeader
                imageUrl={otherMember.profile.imageUrl}
                name={otherMember.profile.name}
                serverId={serverId}
                type='conversation'
            />

            <div className='flex-1 overflow-y-auto'>
                <div className='p-4'>Future Messages</div>
            </div>

            <div className='border-t bg-muted p-4'>
                <ChatInput
                    name={otherMember.profile.name}
                    type={"conversation"}
                    apiUrl={"/api/socket/messages"}
                    query={{
                        serverId: serverId
                    }}
                />
            </div>
        </div>
    )
}

export default ConversationPage
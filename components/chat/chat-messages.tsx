"use client"

import { type Member, type Message, type Profile } from "@/lib/generated/prisma/client"
import ChatWelcome from "./chat-welcome"
import { useChatQuery } from "@/hooks/use-chat-query"
import { Loader2, ServerCrash } from "lucide-react"
import { Fragment } from "react"
import ChatItem from "./chat-item"
import { format } from "date-fns"

const DATE_FORMAT = 'd MMM yyyy, HH:mm'

interface ChatMessagesProps {
    name: string,
    member: Member,
    chatId: string,
    apiUrl: string,
    socketUrl: string,
    socketQuery: Record<string, string>,
    paramKey: "channelId" | "conversationId",
    paramValue: string,
    type: "channel" | "conversation"
}

type MessageWithMemberProfile = Message & {
    member: Member & {
        profile: Profile
    },
}

const ChatMessages = ({ name, member, chatId, apiUrl, socketUrl, socketQuery, paramKey, paramValue, type }: ChatMessagesProps) => {
    const queryKey = `chat:${chatId}`
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useChatQuery({ apiUrl, paramKey, paramValue, queryKey })

    if (status === "pending") {
        return (
            <div className="flex flex-col flex-1 justify-center items-center">
                <Loader2 className="h-6 w-6 animate-spin my-4" />
            </div>
        )
    }
    if (status === "error") {
        return (
            <div className="flex flex-col flex-1 justify-center items-center">
                <ServerCrash className="h-6 w-6 my-4" />
                <p className="text-xs">Something went wrong!</p>
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col py-4 overflow-y-auto">
            <div className="flex-1">
                <ChatWelcome type={type} name={name} />

                {/* messages */}
                <div className="flex flex-col-reverse mt-auto">
                    {data?.pages?.map((group, i) => (
                        <Fragment key={i}>
                            {group.items.map((message: MessageWithMemberProfile) => (
                                <ChatItem key={message.id}
                                    id={message.id}
                                    content={message.content}
                                    currentMember={member}
                                    fileUrl={message.fileUrl}
                                    deleted={message.deleted}
                                    timestamp={format(new Date(message.createAt), DATE_FORMAT)}
                                    isUpdated={message.createAt != message.updatedAt}
                                    socketUrl={socketUrl}
                                    socketQuery={socketQuery}
                                    member={message.member}
                                />
                            ))}
                        </Fragment>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default ChatMessages
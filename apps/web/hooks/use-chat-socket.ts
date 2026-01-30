import { useSocket } from "@/components/providers/socket-provider";
import { Member, Message, Profile } from "@repo/db";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

type ChatSocketProvider = {
    addKey: string;
    updateKey: string;
    queryKey: string;
};

type MessageWithMemberWithProfile = Message & {
    member: Member & {
        profile: Profile;
    };
};

export const useChatSocket = ({
    addKey,
    updateKey,
    queryKey,
    chatId,
    type,
}: ChatSocketProvider & {
    chatId: string;
    type: "channel" | "conversation";
}) => {
    const { socket } = useSocket();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!socket || !chatId) {
            return;
        }

        // Join room based on type
        const event = type === "channel" ? "join-channel" : "join-conversation";
        socket.emit(event, chatId);
        console.log(`🏠 Joined room: ${type}:${chatId}`);

        socket.on(updateKey, (message: MessageWithMemberWithProfile) => {
            queryClient.setQueryData(
                [queryKey],
                (
                    oldData:
                        | InfiniteData<{
                              items: MessageWithMemberWithProfile[];
                          }>
                        | undefined,
                ) => {
                    if (
                        !oldData ||
                        !oldData.pages ||
                        oldData.pages.length === 0
                    ) {
                        return oldData;
                    }
                    const newData = oldData.pages.map((page) => {
                        return {
                            ...page,
                            items: page.items.map(
                                (item: MessageWithMemberWithProfile) => {
                                    if (item.id === message.id) {
                                        return message;
                                    }
                                    return item;
                                },
                            ),
                        };
                    });
                    return {
                        ...oldData,
                        pages: newData,
                    };
                },
            );
        });

        socket.on(addKey, (message: MessageWithMemberWithProfile) => {
            queryClient.setQueryData(
                [queryKey],
                (
                    oldData:
                        | InfiniteData<{
                              items: MessageWithMemberWithProfile[];
                          }>
                        | undefined,
                ) => {
                    if (
                        !oldData ||
                        !oldData.pages ||
                        oldData.pages.length === 0
                    ) {
                        return {
                            pages: [
                                {
                                    items: [message],
                                },
                            ],
                        };
                    }
                    const newData = [...oldData.pages];
                    newData[0] = {
                        ...newData[0],
                        items: [message, ...newData[0].items],
                    };
                    return {
                        ...oldData,
                        pages: newData,
                    };
                },
            );
        });

        return () => {
            const leaveEvent =
                type === "channel" ? "leave-channel" : "leave-conversation";
            socket.emit(leaveEvent, chatId);
            socket.off(addKey);
            socket.off(updateKey);
        };
    }, [queryClient, addKey, queryKey, socket, updateKey, chatId, type]);
};

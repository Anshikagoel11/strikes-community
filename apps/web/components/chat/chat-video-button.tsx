"use client";

import { useCall } from "@/hooks/use-call";
import { useAuth, useUser } from "@clerk/nextjs";
import { Video, VideoOff } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import qs from "query-string";
import ActionTooltip from "../action-tooltip";

interface ChatVideoButtonProps {
    recipientMemberId?: string;
    recipientName?: string;
    recipientImageUrl?: string;
    conversationId?: string;
}

export const ChatVideoButton = ({
    recipientMemberId,
    recipientName,
    recipientImageUrl,
    conversationId,
}: ChatVideoButtonProps) => {
    const { user } = useUser();
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const isVideo = searchParams?.get("video");
    const { userId } = useAuth();
    const { initiateCall, endCall } = useCall();

    const onClick = () => {
        if (isVideo) {
            // End call via socket to clear Redis state
            endCall();

            // Navigate back to chat
            const url = qs.stringifyUrl(
                {
                    url: pathname || "",
                    query: {
                        video: undefined,
                    },
                },
                { skipNull: true },
            );
            router.push(url);
        } else {
            // Initiate call via socket
            if (
                userId &&
                recipientMemberId &&
                recipientName &&
                conversationId &&
                user
            ) {
                initiateCall(
                    userId,
                    user.firstName || user.username || "Unknown",
                    user.imageUrl,
                    recipientMemberId,
                    recipientName,
                    recipientImageUrl || "",
                    conversationId,
                    "video",
                );
            }
        }
    };

    const Icon = isVideo ? VideoOff : Video;
    const toolTipLabel = isVideo ? "End video call" : "Start video call";

    return (
        <ActionTooltip side="bottom" label={toolTipLabel}>
            <button
                onClick={onClick}
                className="hover:opacity-75 transition mr-4"
            >
                <Icon className="h-6 w-6" />
            </button>
        </ActionTooltip>
    );
};

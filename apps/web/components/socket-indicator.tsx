"use client";

import { useSocket } from "./providers/socket-provider";
import { Badge } from "./ui/badge";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface SocketIndicatorProps {
    recipientUserId?: string;
}

export const SocketIndicator = ({ recipientUserId }: SocketIndicatorProps) => {
    const { isConnected } = useSocket();

    const { data } = useQuery({
        queryKey: ["user-status", recipientUserId],
        queryFn: async () => {
            const res = await axios.get(`/api/users/${recipientUserId}/status`);
            return res.data as { isLive: boolean };
        },
        enabled: !!recipientUserId,
        refetchInterval: 10000, // Refetch every 10s for production readiness
    });

    if (recipientUserId) {
        if (data?.isLive) {
            return (
                <Badge
                    variant={"outline"}
                    className="bg-primary-color text-white border-none"
                >
                    Live
                </Badge>
            );
        }

        return (
            <Badge
                variant={"outline"}
                className="bg-gray-500 text-white border-none"
            >
                Offline
            </Badge>
        );
    }

    if (!isConnected) {
        return (
            <Badge
                variant={"outline"}
                className="bg-yellow-600 text-white border-none"
            >
                Fallback: Polling in every 1s
            </Badge>
        );
    }

    return (
        <Badge
            variant={"outline"}
            className="bg-primary-color text-white border-none"
        >
            Live
        </Badge>
    );
};

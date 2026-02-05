"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "@clerk/nextjs";

type SocketContentType = {
    socket: Socket | null;
    isConnected: boolean;
};

const socketContext = createContext<SocketContentType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => {
    return useContext(socketContext);
};

import { useParams } from "next/navigation";

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { userId } = useAuth();
    const params = useParams();

    const serverId = params?.serverId as string | undefined;

    useEffect(() => {
        const socketInstance = io(
            process.env.NEXT_PUBLIC_SOCKET_URL ||
                process.env.NEXT_PUBLIC_SITE_URL ||
                undefined,
            {
                path: "/api/socket/io",
                addTrailingSlash: false,
            },
        );

        socketInstance.on("connect", () => {
            setIsConnected(true);
            setSocket(socketInstance);
        });

        socketInstance.on("disconnect", () => {
            setIsConnected(false);
            setSocket(null);
        });

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    useEffect(() => {
        if (socket && userId) {
            socket.emit("identify", { userId, serverId });
            console.log(`📡 User identified: ${userId}, serverId: ${serverId}`);
        }
    }, [socket, userId, serverId]);

    return (
        <socketContext.Provider value={{ socket, isConnected }}>
            {children}
        </socketContext.Provider>
    );
};

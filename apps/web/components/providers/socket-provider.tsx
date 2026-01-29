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

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { userId } = useAuth();

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

        const handleConnect = () => {
            setIsConnected(true);
            setSocket(socketInstance);

            // Identify user to server for session tracking
            if (userId) {
                socketInstance.emit("identify", { userId });
                console.log(`📡 User identified: ${userId}`);
            }
        };

        const handleDisconnect = () => {
            setIsConnected(false);
            setSocket(null);
        };

        socketInstance.on("connect", handleConnect);
        socketInstance.on("disconnect", handleDisconnect);

        return () => {
            socketInstance.off("connect", handleConnect);
            socketInstance.off("disconnect", handleDisconnect);
            socketInstance.disconnect();
        };
    }, [userId]);

    return (
        <socketContext.Provider value={{ socket, isConnected }}>
            {children}
        </socketContext.Provider>
    );
};

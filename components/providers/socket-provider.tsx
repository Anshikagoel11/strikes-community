'use client'
import { createContext, useContext, useEffect, useState } from "react"
import { io, type Socket } from "socket.io-client"


type SocketContentType = {
    socket: Socket | null,
    isConnected: boolean
}

const socketContext = createContext<SocketContentType>({
    socket: null,
    isConnected: false
})

export const useSocket = () => {
    return useContext(socketContext)
}

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null)
    const [isConnected, setIsConnected] = useState(false)

    useEffect(() => {
        const socketInstance = io(process.env.NEXT_PUBLIC_SITE_URL ?? undefined, {
            path: "/api/socket/io",
        })

        const handleConnect = () => {
            setIsConnected(true)
            setSocket(socketInstance)
        }

        const handleDisconnect = () => {
            setIsConnected(false)
            setSocket(null)
        }

        socketInstance.on("connect", handleConnect)
        socketInstance.on("disconnect", handleDisconnect)

        return () => {
            socketInstance.off("connect", handleConnect)
            socketInstance.off("disconnect", handleDisconnect)
            socketInstance.disconnect()
        }

    }, [])

    return (
        <socketContext.Provider value={{ socket, isConnected }}>
            {children}
        </socketContext.Provider>
    )
}
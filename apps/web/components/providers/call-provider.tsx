"use client";

import {
    createContext,
    useContext,
    useCallback,
    useEffect,
    useState,
} from "react";
import { useSocket } from "@/components/providers/socket-provider";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

export interface CallState {
    callId: string | null;
    isIncoming: boolean;
    isOutgoing: boolean;
    callerId?: string;
    callerName?: string;
    callerImage?: string;
    recipientId?: string;
    recipientName?: string;
    recipientImage?: string;
    conversationId?: string;
    callType?: "video" | "audio";
    initiatedAt?: number;
}

export interface CallContextType {
    callState: CallState;
    initiateCall: (
        callerId: string,
        callerName: string,
        callerImage: string,
        recipientId: string,
        recipientName: string,
        recipientImage: string,
        conversationId: string,
        callType?: "video" | "audio",
    ) => void;
    acceptCall: (callId: string) => void;
    rejectCall: (callId: string) => void;
    cancelCall: (callId: string) => void;
    endCall: (callId?: string) => void;
    clearCallState: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider = ({ children }: { children: React.ReactNode }) => {
    const { socket } = useSocket();
    const router = useRouter();
    const pathname = usePathname();
    const [callState, setCallState] = useState<CallState>({
        callId: null,
        isIncoming: false,
        isOutgoing: false,
        initiatedAt: undefined,
    });

    // Initiate a call
    const initiateCall = useCallback(
        (
            callerId: string,
            callerName: string,
            callerImage: string,
            recipientId: string,
            recipientName: string,
            recipientImage: string,
            conversationId: string,
            callType: "video" | "audio" = "video",
        ) => {
            if (!socket) return;

            setCallState({
                callId: null,
                isOutgoing: true,
                isIncoming: false,
                recipientId,
                recipientName,
                recipientImage,
                conversationId,
                callType,
            });

            socket.emit("call:initiate", {
                callerId,
                callerName,
                callerImage,
                recipientId,
                recipientName,
                recipientImage,
                conversationId,
                callType,
            });
        },
        [socket],
    );

    // Accept incoming call
    const acceptCall = useCallback(
        (callId: string) => {
            if (!socket) return;
            socket.emit("call:accept", { callId });
        },
        [socket],
    );

    // Reject incoming call
    const rejectCall = useCallback(
        (callId: string) => {
            if (!socket) return;
            socket.emit("call:reject", { callId });
            setCallState({
                callId: null,
                isIncoming: false,
                isOutgoing: false,
            });
        },
        [socket],
    );

    // Cancel outgoing call
    const cancelCall = useCallback(
        (callId: string) => {
            if (!socket) return;
            socket.emit("call:cancel", { callId });
            setCallState({
                callId: null,
                isIncoming: false,
                isOutgoing: false,
            });
        },
        [socket],
    );

    // End active call
    const endCall = useCallback(
        (callId?: string) => {
            if (!socket) return;
            socket.emit("call:end", { callId });
            setCallState({
                callId: null,
                isIncoming: false,
                isOutgoing: false,
            });
        },
        [socket],
    );

    // Clear call state
    const clearCallState = useCallback(() => {
        setCallState({
            callId: null,
            isIncoming: false,
            isOutgoing: false,
        });
    }, []);

    // Listen for socket events
    useEffect(() => {
        if (!socket) return;

        // Incoming call
        socket.on(
            "call:incoming",
            (data: {
                callId: string;
                callerId: string;
                callerName: string;
                callerImage: string;
                conversationId: string;
                callType: "video" | "audio";
                initiatedAt: number;
            }) => {
                setCallState({
                    callId: data.callId,
                    isIncoming: true,
                    isOutgoing: false,
                    callerId: data.callerId,
                    callerName: data.callerName,
                    callerImage: data.callerImage,
                    conversationId: data.conversationId,
                    callType: data.callType,
                    initiatedAt: data.initiatedAt,
                });
            },
        );

        // Call is ringing (for caller)
        socket.on(
            "call:ringing",
            (data: {
                callId: string;
                recipientId: string;
                recipientName: string;
                initiatedAt: number;
            }) => {
                setCallState((prev) => ({
                    ...prev,
                    callId: data.callId,
                    initiatedAt: data.initiatedAt,
                }));
            },
        );

        // Call accepted
        socket.on("call:accepted", () => {
            // Clear state BEFORE navigation to prevent "already in call" error
            setCallState({
                callId: null,
                isIncoming: false,
                isOutgoing: false,
            });

            // Navigate to video call
            router.push(`${pathname || ""}?video=true`);
        });

        // Call rejected
        socket.on(
            "call:rejected",
            (_data: { callId: string; recipientName: string }) => {
                toast.error("Call rejected");
                clearCallState();
            },
        );

        // Call cancelled
        socket.on("call:cancelled", () => {
            clearCallState();
        });

        // Call ended
        socket.on("call:ended", () => {
            console.log("[Socket] Call ended event received");
            toast.info("Call ended");
            clearCallState();

            // If we are currently in video mode, navigate back to chat
            const searchParams = new URLSearchParams(window.location.search);
            if (searchParams.get("video") === "true") {
                router.push((pathname as string) || "/");
            }
        });

        // User offline
        socket.on("call:user-offline", () => {
            toast.error("User is offline");
            clearCallState();
        });

        // User busy
        socket.on("call:user-busy", () => {
            toast.error("User is busy");
            clearCallState();
        });

        // Call error
        socket.on("call:error", (data: { message: string }) => {
            console.error("Call error:", data.message);
            toast.error(data.message);
            clearCallState();
        });

        return () => {
            socket.off("call:incoming");
            socket.off("call:ringing");
            socket.off("call:accepted");
            socket.off("call:rejected");
            socket.off("call:cancelled");
            socket.off("call:ended");
            socket.off("call:user-offline");
            socket.off("call:user-busy");
            socket.off("call:error");
        };
    }, [socket, router, pathname, clearCallState]);

    return (
        <CallContext.Provider
            value={{
                callState,
                initiateCall,
                acceptCall,
                rejectCall,
                cancelCall,
                endCall,
                clearCallState,
            }}
        >
            {children}
        </CallContext.Provider>
    );
};

export const useCallContext = () => {
    const context = useContext(CallContext);
    if (context === undefined) {
        throw new Error("useCallContext must be used within a CallProvider");
    }
    return context;
};

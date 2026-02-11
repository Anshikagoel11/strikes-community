"use client";

import { useUser } from "@clerk/nextjs";
import { Loader2, Mic, Video } from "lucide-react";
import { useEffect, useState } from "react";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import qs from "query-string";
import { useTheme } from "next-themes";

interface MediaRoomProps {
    chatId: string;
    video: boolean;
    audio: boolean;
    autoJoin?: boolean;
}

export const MediaRoom = ({
    chatId,
    video,
    audio,
    autoJoin = false,
}: MediaRoomProps) => {
    const { user } = useUser();
    const [token, setToken] = useState("");
    const [isMounted, setIsMounted] = useState(false);
    const [joined, setJoined] = useState(autoJoin);
    const router = useRouter();
    const pathname = usePathname();
    const { theme } = useTheme();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!joined) return;
        if (!user?.id || !user?.firstName || !user?.lastName) return;

        const name = `${user.firstName} ${user.lastName}`;

        const wrapper = async () => {
            try {
                const resp = await fetch(
                    `/api/livekit?room=${chatId}&identity=${user.id}&name=${encodeURIComponent(name)}`,
                );
                const data = await resp.json();
                setToken(data.token);
            } catch (e) {
                console.log(e);
            }
        };
        wrapper();
    }, [user?.id, user?.firstName, user?.lastName, chatId, joined]);

    if (!isMounted) return null;

    if (!joined) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 space-y-4">
                <div className="p-4 rounded-full bg-primary/10">
                    {video ? (
                        <Video className="h-12 w-12 text-primary" />
                    ) : (
                        <Mic className="h-12 w-12 text-primary" />
                    )}
                </div>
                <div className="text-center space-y-1">
                    <h3 className="text-xl font-bold">
                        {video ? "Video Channel" : "Voice Channel"}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                        Confirm to join this media room
                    </p>
                </div>
                <Button
                    onClick={() => setJoined(true)}
                    className="px-8"
                    size="lg"
                >
                    Join Room
                </Button>
            </div>
        );
    }

    if (token === "") {
        return (
            <div className="flex items-center justify-center flex-1 flex-col">
                <Loader2 className="h-7 w-7 animate-spin my-4" />
                <p className="text-xs font-medium text-muted-foreground">
                    Joining room...
                </p>
            </div>
        );
    }

    return (
        <LiveKitRoom
            data-lk-theme={theme === "dark" ? "dark" : "light"}
            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
            token={token}
            connect={true}
            video={video}
            audio={audio}
            onError={(e) => {
                console.error("LiveKit Room Error:", e);
            }}
            onDisconnected={() => {
                console.log("LiveKit Room Disconnected");
                setJoined(false);
                setToken("");
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
            }}
        >
            <VideoConference />
        </LiveKitRoom>
    );
};

"use client";

import { Sparkles, Sparkle } from "lucide-react";
import { useAIStore } from "@/hooks/use-ai-store";
import { cn } from "@/lib/utils";
import ActionTooltip from "../action-tooltip";

export const ChatAIToggle = () => {
    const { isAIEnabled, toggleAI } = useAIStore();

    return (
        <ActionTooltip
            side="bottom"
            label={isAIEnabled ? "Standard Chat" : "AI Mode"}
        >
            <button
                onClick={toggleAI}
                type="button"
                className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-xl mr-2 transition-all duration-200",
                    isAIEnabled
                        ? "bg-linear-to-br from-primary-color to-primary-color/90 text-white shadow-md hover:shadow-lg"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700",
                )}
            >
                {isAIEnabled ? (
                    <Sparkles className="w-5 h-5 fill-current" />
                ) : (
                    <Sparkle className="w-5 h-5" />
                )}
            </button>
        </ActionTooltip>
    );
};

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
                        : "bg-primary-color/20 dark:bg-primary-color/20 hover:bg-primary-color/40 dark:hover:bg-primary-color/40 text-primary-color dark:text-primary-color",
                )}
            >
                {isAIEnabled ? (
                    <Sparkles className="w-5 h-5 fill-current" />
                ) : (
                    <Sparkle className="w-5 h-5 fill-primary-color" />
                )}
            </button>
        </ActionTooltip>
    );
};

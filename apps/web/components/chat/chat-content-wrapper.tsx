"use client";

import { useAIStore } from "@/hooks/use-ai-store";
import { ChatAI } from "./chat-ai";
import { AnimatePresence, motion } from "motion/react";

interface ChatContentWrapperProps {
    children: React.ReactNode;
}

export const ChatContentWrapper = ({ children }: ChatContentWrapperProps) => {
    const { isAIEnabled } = useAIStore();

    return (
        <div className="flex-1 flex flex-col overflow-hidden relative">
            <AnimatePresence mode="wait">
                {isAIEnabled ? (
                    <motion.div
                        key="ai"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="flex-1 h-full"
                    >
                        <ChatAI />
                    </motion.div>
                ) : (
                    <motion.div
                        key="chat"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="flex-1 flex flex-col overflow-hidden"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

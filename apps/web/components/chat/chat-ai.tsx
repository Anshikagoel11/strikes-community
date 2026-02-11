"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: "user" | "ai";
    content: string;
}

export const ChatAI = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "ai",
            content: "Hello! I'm your AI assistant. How can I help you today?",
        },
    ]);
    const [input, setInput] = useState("");

    const handleSend = () => {
        if (!input.trim()) return;

        const newUserMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
        };

        setMessages((prev) => [...prev, newUserMessage]);
        setInput("");

        setTimeout(() => {
            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: "ai",
                content:
                    "I'm processing your request using the integrated AI engine.",
            };
            setMessages((prev) => [...prev, aiResponse]);
        }, 1000);
    };

    return (
        <div className="relative flex flex-col h-full bg-white dark:bg-zinc-950 overflow-hidden">
            {/* Glowing gradient at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none">
                <div className="absolute inset-0 bg-linear-to-t from-primary-color/20 via-primary-color/5 to-transparent blur-3xl" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-primary-color/30 blur-[100px] rounded-full" />
            </div>

            {/* Messages area */}
            <div className="relative flex-1 overflow-y-auto px-4 md:px-6 py-8 space-y-6 scrollbar-none">
                <div className="max-w-4xl mx-auto space-y-6">
                    <AnimatePresence mode="popLayout" initial={false}>
                        {messages.map((message) => (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                className={cn(
                                    "flex items-start gap-x-4",
                                    message.role === "user"
                                        ? "flex-row-reverse"
                                        : "flex-row",
                                )}
                            >
                                <div
                                    className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
                                        message.role === "ai"
                                            ? "bg-linear-to-br from-primary-color to-indigo-600 text-white"
                                            : "bg-linear-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-700 text-zinc-700 dark:text-zinc-300",
                                    )}
                                >
                                    {message.role === "ai" ? (
                                        <Bot className="w-5 h-5" />
                                    ) : (
                                        <User className="w-5 h-5" />
                                    )}
                                </div>
                                <div
                                    className={cn(
                                        "max-w-[80%] px-5 py-3.5 rounded-2xl text-base leading-relaxed shadow-sm",
                                        message.role === "ai"
                                            ? "bg-zinc-100 dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                                            : "bg-linear-to-br from-primary-color to-primary-color/90 text-white shadow-lg shadow-primary-color/20",
                                    )}
                                >
                                    {message.content}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Input area */}
            <div className="relative p-6 pb-8">
                <div className="max-w-4xl mx-auto">
                    <div className="relative group bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl p-2 transition-all focus-within:ring-2 focus-within:ring-primary-color/40 focus-within:shadow-lg focus-within:shadow-primary-color/10 border border-zinc-200 dark:border-zinc-800 shadow-xl">
                        <div className="flex items-center gap-x-3">
                            <button className="p-3 text-zinc-500 hover:text-primary-color hover:bg-primary-color/10 rounded-xl transition-all">
                                <Mic className="w-5 h-5" />
                            </button>
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === "Enter" && handleSend()
                                }
                                placeholder="Message..."
                                className="flex-1 bg-transparent border-none focus:ring-0 text-base py-3 px-2 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none"
                                autoFocus
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim()}
                                className={cn(
                                    "p-3 rounded-xl transition-all duration-200",
                                    input.trim()
                                        ? "bg-linear-to-br from-primary-color to-primary-color/90 text-white shadow-lg shadow-primary-color/30 hover:shadow-xl hover:shadow-primary-color/40 hover:scale-105"
                                        : "text-zinc-400 dark:text-zinc-600 cursor-not-allowed",
                                )}
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

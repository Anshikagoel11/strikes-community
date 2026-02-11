"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { Form, FormControl, FormField, FormItem } from "../ui/form";
import { Plus, Send, Loader2 } from "lucide-react";
import qs from "query-string";
import axios from "axios";
import { useModal } from "@/hooks/use-mode-store";
import EmojiPicker from "../emoji-picker";
import { cn } from "@/lib/utils";

interface ChatInputProps {
    apiUrl: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: Record<string, any>;
    name: string;
    type: "conversation" | "channel";
}

const formSchema = z.object({
    content: z.string().min(1),
});

const ChatInput = ({ apiUrl, query, name, type }: ChatInputProps) => {
    const { onOpen } = useModal();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            content: "",
        },
    });
    const isLoading = form.formState.isSubmitting;

    const onSubmit = async (value: z.infer<typeof formSchema>) => {
        try {
            const url = qs.stringifyUrl({
                url: apiUrl,
                query,
            });
            const response = await axios.post(url, value);
            if (response) {
                form.reset();
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormControl>
                                <div className="relative group">
                                    <div className="relative flex items-center gap-x-3 bg-primary-foreground p-2 rounded-[1.5rem] border border-zinc-200 dark:border-zinc-800 transition-all focus-within:ring-2 focus-within:ring-primary-color/20 focus-within:bg-white dark:focus-within:bg-zinc-900">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onOpen("messageFile", {
                                                    apiUrl,
                                                    query,
                                                })
                                            }
                                            className="h-9 w-9 flex items-center justify-center rounded-full bg-zinc-200/50 dark:bg-zinc-700/50 hover:bg-primary-color hover:text-white dark:hover:bg-primary-color transition-all duration-300 text-zinc-500 dark:text-zinc-400 group/upload"
                                        >
                                            <Plus className="h-5 w-5 transition-transform group-hover/upload:rotate-90" />
                                        </button>
                                        <input
                                            type="text"
                                            autoComplete="off"
                                            disabled={isLoading}
                                            className="flex-1 bg-transparent border-none focus:ring-0 text-lg px-1 dark:text-zinc-200 outline-none placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
                                            placeholder={`Message ${type === "conversation" ? name : "#" + name}`}
                                            {...field}
                                        />
                                        <div className="flex items-center gap-x-2 pr-1">
                                            {field.value?.trim() && (
                                                <button
                                                    type="submit"
                                                    disabled={isLoading}
                                                    className={cn(
                                                        "h-9 w-9 flex items-center justify-center rounded-full transition-all duration-300 bg-primary-color text-white shadow-lg shadow-primary-color/20 active:scale-90",
                                                    )}
                                                >
                                                    {isLoading ? (
                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                    ) : (
                                                        <Send className="h-4 w-4" />
                                                    )}
                                                </button>
                                            )}
                                            <EmojiPicker
                                                onChange={(emoji: string) =>
                                                    field.onChange(
                                                        `${field.value}${emoji}`,
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            </FormControl>
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    );
};

export default ChatInput;

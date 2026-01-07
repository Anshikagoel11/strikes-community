"use client"

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import z from "zod"
import { Form, FormControl, FormField, FormItem } from '../ui/form'
import { Plus } from 'lucide-react'
import qs from "query-string"
import axios from 'axios'
import { useModal } from '@/hooks/use-mode-store'
import EmojiPicker from '../emoji-picker'

interface ChatInputProps {
    apiUrl: string,
    query: Record<string, any>,
    name: string,
    type: "conversation" | "channel"
}

const formSchema = z.object({
    content: z.string().min(1)
})

const ChatInput = ({ apiUrl, query, name, type }: ChatInputProps) => {
    const { onOpen } = useModal()
    const form = useForm<z.infer<typeof formSchema>>(
        {
            resolver: zodResolver(formSchema),
            defaultValues: {
                content: ""
            }
        }
    )
    const isLoading = form.formState.isSubmitting

    const onSubmit = async (value: z.infer<typeof formSchema>) => {
        try {
            const url = qs.stringifyUrl({
                url: apiUrl,
                query,
            })
            const response = await axios.post(url, value)
            if (response) {
                form.reset()
            }
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='w-full'>
                <FormField control={form.control} name='content' render={({ field }) => (
                    <FormItem className='w-full'>
                        <FormControl>
                            <div className='flex items-center gap-2 w-full'>
                                <button type='button' className='h-10 w-10 rounded-md bg-card flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition' onClick={() => onOpen("messageFile", { apiUrl, query })}>
                                    <Plus className='text-zinc-500 dark:text-zinc-400' />
                                </button>
                                <input type="text" className='bg-card p-2 rounded-md relative w-full' placeholder={`Message ${type === "conversation" ? name : "#" + name}`} {...field} disabled={isLoading} autoComplete="off" />
                                <EmojiPicker onChange={(emoji: string) => field.onChange(`${field.value} ${emoji}`)} />

                            </div>
                        </FormControl>
                    </FormItem>
                )} />
            </form>
        </Form>
    )
}

export default ChatInput
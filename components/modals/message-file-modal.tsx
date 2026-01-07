"use client"

import { useForm } from 'react-hook-form'
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"
import qs from "query-string"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Button } from '../ui/button'
import FileUpload from '../file-upload'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Spinner } from '../ui/spinner'
import { useModal } from '@/hooks/use-mode-store'


const formSchema = z.object({
    fileUrl: z.string().min(1, { message: "Upload attachment first" })
})


const MessageFileModal = () => {
    const router = useRouter()
    const { isOpen, onClose, type, data } = useModal()
    const isModalOpen = isOpen && type === "messageFile"

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fileUrl: ""
        }
    })

    const handleClose = () => {
        form.reset()
        onClose()
    }

    const loading = form.formState.isSubmitting;
    const { apiUrl, query } = data

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        const loadingId = toast.loading("uploading attachment")
        try {
            const url = qs.stringifyUrl({
                url: apiUrl || "",
                query
            })
            await axios.post(url, {
                ...values, content: values.fileUrl
            })
            form.reset();
            router.refresh()
            toast.success("attachment sent", {
                id: loadingId
            })
            handleClose()
        } catch (error) {
            console.log("unable to send attachment", error)
            toast.error("Something went wrong. Please try again.", {
                id: loadingId
            })
        }
    }

    return (
        <Dialog open={isModalOpen} onOpenChange={handleClose}>
            <DialogContent className="bg-background text-foreground p-0 overflow-hidden">
                <DialogHeader className="pt-8 px-6">
                    <DialogTitle className="text-2xl text-center font-bold">Add an attachment</DialogTitle>
                    <DialogDescription className="text-center text-muted-foreground">
                        You can upload and send file and image from here as a message
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className="space-y-8 px-6">
                            <div className="flex items-center justify-center text-center">
                                <FormField
                                    control={form.control}
                                    name="fileUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <FileUpload
                                                    endpoint="messageFile"
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                        <DialogFooter className="bg-muted/50 px-6 py-4">
                            <Button disabled={loading} variant="primary">
                                {loading ? <Spinner /> : "Send"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

export default MessageFileModal
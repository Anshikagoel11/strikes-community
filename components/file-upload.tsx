"use client"
import React from 'react'
import { UploadDropzone } from '@/lib/uploadthing'
import "@uploadthing/react"
import { X } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

interface fileUploadProp {
    onChange: (url?: string) => void,
    value: string,
    endpoint: "imageUploader"
}

const FileUpload = ({ onChange, value, endpoint }: fileUploadProp) => {
    const fileType = value?.split(".").pop()
    if (value && fileType !== "pdf") {
        return (
            <div className="relative h-20 w-20">
                <Image
                    fill
                    src={value}
                    alt="Upload"
                    className="rounded-full"
                />
                <button
                    onClick={() => onChange("")}
                    className="bg-destructive text-white p-1 rounded-full absolute top-0 right-0 shadow-sm"
                    type="button"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        )
    }
    return (
        <UploadDropzone
            endpoint={endpoint}
            onClientUploadComplete={(res) => {
                onChange(res?.[0].ufsUrl);
            }}
            onUploadError={(err) => {
                console.log(err)
                toast.error("Upload failed. Please try again.")
            }}
            appearance={{
                button: "bg-indigo-500 hover:bg-indigo-500/90 text-white",
                container: "border-neutral-200 dark:border-neutral-800",
                label: "text-indigo-500 hover:text-indigo-500/90"
            }}
        />
    )
}

export default FileUpload
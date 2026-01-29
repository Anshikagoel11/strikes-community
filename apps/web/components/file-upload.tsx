"use client";
import React from "react";
import { UploadDropzone } from "@/lib/uploadthing";
import "@uploadthing/react";
import { FileIcon, X } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface fileUploadProp {
    onChange: (url?: string) => void;
    value: string;
    endpoint: "imageUploader" | "messageFile";
}

const FileUpload = ({ onChange, value, endpoint }: fileUploadProp) => {
    const fileType = value?.split(".").pop();
    const [imgError, setImgError] = React.useState(false);

    if (value && fileType !== "pdf") {
        return (
            <div className="relative h-20 w-20">
                {!imgError ? (
                    <Image
                        fill
                        src={value}
                        alt="Upload"
                        className="rounded-full"
                        onError={() => setImgError(true)}
                        onLoadingComplete={() => setImgError(false)}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full w-full bg-neutral-100 rounded-full dark:bg-neutral-900">
                        <FileIcon className="h-8 w-8 text-neutral-500" />
                    </div>
                )}

                <button
                    onClick={() => onChange("")}
                    className="bg-destructive text-white p-1 rounded-full absolute top-0 right-0 shadow-sm"
                    type="button"
                >
                    <X className="h-4 w-4" />
                </button>
                <a
                    href={value}
                    className="absolute -bottom-7 left-0 hover:underline"
                    target="_blank"
                    rel="noreferrer noopener"
                >
                    {value?.length > 10 ? value?.slice(0, 10) + "..." : value}
                </a>
            </div>
        );
    }
    return (
        <UploadDropzone
            endpoint={endpoint}
            onClientUploadComplete={(res) => {
                onChange(res?.[0].ufsUrl);
            }}
            onUploadError={(err) => {
                console.log(err);
                toast.error("Upload failed. Please try again.");
            }}
            appearance={{
                button: "bg-indigo-500 hover:bg-indigo-500/90 text-white",
                container: "border-neutral-200 dark:border-neutral-800",
                label: "text-indigo-500 hover:text-indigo-500/90",
            }}
        />
    );
};

export default FileUpload;

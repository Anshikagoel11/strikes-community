"use client";
import React from "react";
import { UploadButton } from "@/lib/uploadthing";
import "@uploadthing/react";
import { FileIcon, X, Upload as UploadIcon } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Spinner } from "./ui/spinner";

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
            <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative h-32 w-32 group">
                    {!imgError ? (
                        <Image
                            fill
                            src={value}
                            alt="Upload"
                            className="rounded-full object-cover ring-4 ring-primary/10"
                            onError={() => setImgError(true)}
                            onLoadingComplete={() => setImgError(false)}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full w-full bg-secondary rounded-full ring-4 ring-primary/10">
                            <FileIcon className="h-12 w-12 text-muted-foreground" />
                        </div>
                    )}

                    <button
                        onClick={() => onChange("")}
                        className="absolute -top-2 -right-2 bg-destructive hover:bg-destructive/90 text-white p-2 rounded-full shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                        type="button"
                        aria-label="Remove image"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <p className="text-xs text-muted-foreground">
                    Click the X to change image
                </p>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-primary-color/50 bg-secondary/20 rounded-xl p-8 transition-all duration-200 hover:bg-secondary/40">
            <UploadIcon className="h-10 w-10 text-primary-color mb-4" />
            <p className="text-primary-color font-semibold text-base mb-2">
                Choose a file to upload
            </p>
            <p className="text-muted-foreground text-sm mb-4">
                Image (4MB max)
            </p>

            <UploadButton
                endpoint={endpoint}
                onClientUploadComplete={(res) => {
                    onChange(res?.[0].ufsUrl);
                    toast.success("Upload complete!");
                }}
                onUploadError={(err) => {
                    console.log(err);
                    toast.error("Upload failed. Please try again.");
                }}
                appearance={{
                    button: "bg-primary-color hover:bg-primary-color/90 text-white font-medium px-6 py-2.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md ut-ready:bg-primary-color ut-uploading:cursor-not-allowed ut-uploading:bg-primary-color/50 ut-uploading:animate-pulse",
                    allowedContent: "hidden",
                }}
                content={{
                    button({ ready, isUploading }) {
                        if (isUploading) return <Spinner />;
                        if (ready) return "Choose File";
                        return "Getting ready...";
                    },
                }}
            />
        </div>
    );
};

export default FileUpload;

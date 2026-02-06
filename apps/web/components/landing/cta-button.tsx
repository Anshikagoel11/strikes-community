import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { SignedIn, SignedOut } from "@clerk/nextjs";

interface CTAButtonProps {
    size?: "default" | "sm" | "lg" | "icon";
    variant?: "default" | "secondary";
}

export function CTAButton({
    size = "lg",
    variant = "default",
}: CTAButtonProps) {
    return (
        <>
            <SignedOut>
                <Link href="/sign-up">
                    <Button
                        size={size}
                        className="h-14 px-8 text-lg bg-primary-color text-white hover:bg-primary-color/90 rounded-full shadow-lg shadow-primary-color/25 w-full sm:w-auto"
                    >
                        <LayoutDashboard className="mr-2 h-5 w-5" />
                        Create Account
                    </Button>
                </Link>
                {variant === "default" && (
                    <Link href="/sign-in">
                        <Button
                            variant="secondary"
                            size={size}
                            className="h-14 px-8 text-lg rounded-full shadow-lg w-full sm:w-auto"
                        >
                            Login to Strikes
                        </Button>
                    </Link>
                )}
            </SignedOut>
            <SignedIn>
                <Link href="/setup">
                    <Button
                        size={size}
                        className="h-14 px-8 text-lg bg-primary-color text-white hover:bg-primary-color/90 rounded-full shadow-lg shadow-primary-color/25 w-full sm:w-auto"
                    >
                        <LayoutDashboard className="mr-2 h-5 w-5" />
                        Go to profile
                    </Button>
                </Link>
            </SignedIn>
        </>
    );
}

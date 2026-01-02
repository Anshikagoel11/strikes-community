"use client";

import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Menu } from "lucide-react";
import { motion } from "motion/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Navbar = () => {
    const { userId } = useAuth();

    return (
        <nav className="fixed top-0 w-full z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="container flex h-14 items-center justify-between px-4 md:px-8 mx-auto">
                <Link href="/">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 font-bold text-xl cursor-pointer"
                    >
                        <span>Discord</span>
                    </motion.div>
                </Link>

                <div className="hidden md:flex items-center gap-4">
                    <ModeToggle />
                    <SignedIn>
                        <Link href={`/${userId}`}>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button variant="default" size="sm">
                                    Dashboard
                                </Button>
                            </motion.div>
                        </Link>
                        <UserButton />
                    </SignedIn>
                    <SignedOut>
                        <Link href="/sign-in">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button variant="ghost" size="sm">
                                    Sign In
                                </Button>
                            </motion.div>
                        </Link>
                        <Link href="/sign-up">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button size="sm">Sign Up</Button>
                            </motion.div>
                        </Link>
                    </SignedOut>
                </div>

                {/* Mobile Menu */}
                <div className="md:hidden flex items-center gap-2">
                    <ModeToggle />
                    <SignedIn>
                        <UserButton />
                    </SignedIn>
                    <SignedOut>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href="/sign-in">Sign In</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/sign-up">Sign Up</Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SignedOut>
                </div>
            </div>
        </nav>
    );
};

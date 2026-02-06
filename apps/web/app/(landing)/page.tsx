import { Navbar } from "@/components/navbar";
import Link from "next/link";
import Image from "next/image";
import {
    Shield,
    Users,
    Zap,
    Twitter,
    Instagram,
    Facebook,
    Youtube,
} from "lucide-react";
import { AnimatedFeatureBadge } from "@/components/landing/animated-feature-badge";
import { CTAButton } from "@/components/landing/cta-button";
import { FeatureSection } from "@/components/landing/feature-section";
import { HeroBackground } from "@/components/landing/hero-background";

export default function Home() {
    return (
        <div className="min-h-screen flex flex-col bg-background font-sans selection:bg-primary/20">
            <Navbar />

            <main className="flex-1 w-full overflow-hidden">
                {/* Hero Section */}
                <section className="relative w-full pt-20 pb-16 md:pt-32 md:pb-24 lg:pt-40 lg:pb-32">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
                    <div className="container px-4 md:px-6 mx-auto relative z-10">
                        <div className="flex flex-col items-center text-center space-y-8">
                            {/* Badge */}
                            <AnimatedFeatureBadge />

                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground max-w-5xl">
                                Your Place to{" "}
                                <span className="text-primary-color relative inline-block">
                                    Talk
                                    <svg
                                        className="absolute w-full h-3 -bottom-1 left-0 text-primary-color opacity-80"
                                        viewBox="0 0 100 10"
                                        preserveAspectRatio="none"
                                    >
                                        <path
                                            d="M0 5 Q 50 10 100 5"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            fill="none"
                                        />
                                    </svg>
                                </span>
                                ,{" "}
                                <span className="text-secondary-foreground">
                                    Play
                                </span>
                                , and{" "}
                                <span className="text-primary-color">
                                    Hang Out
                                </span>
                            </h1>

                            <p className="mx-auto max-w-2xl text-muted-foreground text-lg md:text-xl leading-relaxed">
                                Strikes is the only platform you need to build
                                your community. Low-latency voice, HD video, and
                                organized channels for every topic.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-4">
                                <CTAButton />
                            </div>

                            {/* Hero Image Mockup */}
                            <div className="mt-12 w-full max-w-6xl mx-auto rounded-3xl border border-primary-color/20 shadow-2xl bg-secondary/20 overflow-hidden relative aspect-video md:aspect-16/8 flex justify-center items-center group">
                                <HeroBackground />

                                {/* Content */}
                                <div className="flex flex-col items-center justify-center z-10 transition-transform duration-700 group-hover:scale-105">
                                    <span className="text-6xl md:text-8xl lg:text-9xl font-black bg-linear-to-b from-foreground to-foreground/50 bg-clip-text text-transparent select-none tracking-tighter leading-none">
                                        STRIKES
                                    </span>
                                    <span className="text-xl md:text-3xl lg:text-4xl font-semibold text-primary-color/70 tracking-[0.2em] uppercase select-none mt-1 md:mt-2">
                                        Community
                                    </span>
                                </div>

                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-linear-to-t from-background via-background/20 to-transparent pointer-events-none"></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Bento Grid / Feature Highlights */}
                <section className="py-20 bg-muted/30">
                    <div className="container px-4 mx-auto">
                        <div className="mb-16 text-center max-w-3xl mx-auto">
                            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                                Features built for{" "}
                                <span className="text-primary-color">
                                    connection
                                </span>
                            </h2>
                            <p className="text-muted-foreground text-lg">
                                Everything you need to run a world-class
                                community.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <FeatureCard
                                icon={
                                    <Users className="h-10 w-10 text-primary-color" />
                                }
                                title="Community First"
                                description="Organized into topic-based channels where you can collaborate, share, and just talk about your day."
                            />
                            <FeatureCard
                                icon={
                                    <Zap className="h-10 w-10 text-primary-color" />
                                }
                                title="Super Fast"
                                description="Low-latency voice and video feels like you're in the same room. No more lagging conversations."
                            />
                            <FeatureCard
                                icon={
                                    <Shield className="h-10 w-10 text-primary-color" />
                                }
                                title="Safe & Secure"
                                description="Robust moderation tools and custom member access ensure your community stays safe."
                            />
                        </div>
                    </div>
                </section>

                {/* Alternating Feature Sections with Images */}
                <section className="py-24">
                    <FeatureSection
                        imageSrc="/home/1.webp"
                        imageAlt="Community channels and organized conversations"
                        icon={Users}
                        title="Create an invite-only space"
                        description="Strikes servers are organized into topic-based channels where you can collaborate, share, and just talk about your day without clogging up a group chat."
                        features={["Topic-based channels", "Private groups"]}
                    />

                    <FeatureSection
                        imageSrc="/home/2.webp"
                        imageAlt="Voice chat and video calling interface"
                        icon={Zap}
                        title="Where hanging out is easy"
                        description="Grab a seat in a voice channel when you're free. Friends in your server can see you around and instantly pop in to talk without having to call."
                        reversed
                    />

                    <FeatureSection
                        imageSrc="/home/3.webp"
                        imageAlt="Moderation tools and member management"
                        icon={Shield}
                        title="From few to a fandom"
                        description="Get any community running with moderation tools and custom member access. Give members special powers, set up private channels, and more."
                    />
                </section>

                {/* CTA Section */}
                <section className="w-full py-20 lg:py-32 relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary-color/5 -z-10" />
                    <div className="container px-4 md:px-6 mx-auto text-center relative z-10">
                        <div className="space-y-8 max-w-4xl mx-auto">
                            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                                Ready to start your journey?
                            </h2>
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                                Join millions of other communities on Strikes
                                today.
                            </p>
                            <CTAButton variant="secondary" />
                        </div>
                    </div>
                </section>
            </main>

            <footer className="py-16 bg-background border-t">
                <div className="container px-4 md:px-6 mx-auto">
                    <div className="flex flex-col items-center mb-12 space-y-8">
                        <Link
                            href="/"
                            className="flex items-center gap-3 group"
                        >
                            <div className="p-2 bg-primary-color/10 rounded-xl group-hover:bg-primary-color/20 transition-colors">
                                <Image
                                    src="/original.jpg"
                                    alt="Strikes community logo"
                                    width={28}
                                    height={28}
                                    className="object-contain rounded-lg"
                                />
                            </div>
                            <span className="font-bold text-2xl tracking-tighter">
                                Strikes
                            </span>
                        </Link>

                        <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-muted-foreground uppercase tracking-widest">
                            <Link
                                href="#"
                                className="hover:text-primary-color transition-colors"
                            >
                                Pricing
                            </Link>
                            <Link
                                href="#"
                                className="hover:text-primary-color transition-colors"
                            >
                                Blog
                            </Link>
                            <Link
                                href="#"
                                className="hover:text-primary-color transition-colors"
                            >
                                Privacy
                            </Link>
                            <Link
                                href="#"
                                className="hover:text-primary-color transition-colors"
                            >
                                Terms
                            </Link>
                        </nav>
                    </div>

                    <div className="w-full border-t border-dashed border-border/60 mb-8" />

                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <p className="text-sm text-muted-foreground order-2 md:order-1 font-medium">
                            &copy; 2026 Strikes Community. All rights reserved.
                        </p>

                        <div className="flex items-center gap-6 order-1 md:order-2">
                            <Link
                                href="#"
                                className="text-muted-foreground hover:text-primary-color transition-colors hover:scale-110"
                                aria-label="Twitter"
                            >
                                <Twitter className="h-5 w-5" />
                            </Link>
                            <Link
                                href="#"
                                className="text-muted-foreground hover:text-primary-color transition-colors hover:scale-110"
                                aria-label="Instagram"
                            >
                                <Instagram className="h-5 w-5" />
                            </Link>
                            <Link
                                href="#"
                                className="text-muted-foreground hover:text-primary-color transition-colors hover:scale-110"
                                aria-label="Facebook"
                            >
                                <Facebook className="h-5 w-5" />
                            </Link>
                            <Link
                                href="#"
                                className="text-muted-foreground hover:text-primary-color transition-colors hover:scale-110"
                                aria-label="YouTube"
                            >
                                <Youtube className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="flex flex-col items-center text-center space-y-4 p-8 rounded-3xl bg-card border border-border/50 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
            <div className="p-4 bg-primary-color/5 rounded-2xl border border-primary-color/10 group-hover:bg-primary-color/10 transition-colors">
                {icon}
            </div>
            <h3 className="text-2xl font-bold">{title}</h3>
            <p className="text-muted-foreground leading-relaxed text-lg">
                {description}
            </p>
        </div>
    );
}

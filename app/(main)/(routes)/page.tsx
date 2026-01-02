"use client";

import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "motion/react";
import { Download, Globe, Shield, Sparkles, Users, Zap, LayoutDashboard } from "lucide-react";
import { SignedIn, SignedOut, useAuth } from "@clerk/nextjs";

export default function Home() {
  const { userId } = useAuth();
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-12 md:py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
          <div className="container px-4 md:px-6 mx-auto relative z-10">
            <motion.div
              initial="initial"
              animate="animate"
              variants={staggerContainer}
              className="flex flex-col items-center space-y-6 text-center"
            >
              <motion.div variants={fadeInUp} className="space-y-4 max-w-4xl mx-auto">
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-primary pb-2">
                  GROUP CHAT THAT’S ALL FUN & GAMES
                </h1>
                <p className="mx-auto max-w-3xl text-muted-foreground text-lg md:text-xl lg:text-2xl leading-relaxed">
                  Discord is great for playing games and chilling with friends, or even building a worldwide community. Customize your own space to talk, play, and hang out.
                </p>
              </motion.div>
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <SignedOut>
                  <Link href="/sign-up">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="lg" className="h-14 px-8 text-lg bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-lg shadow-primary/25 w-full sm:w-auto">
                        <Download className="mr-2 h-5 w-5" />
                        Download for Linux
                      </Button>
                    </motion.div>
                  </Link>
                  <Link href="/sign-in">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="secondary" size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg w-full sm:w-auto">
                        Open Discord in your browser
                      </Button>
                    </motion.div>
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Link href={`/${userId}`}>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="lg" className="h-14 px-8 text-lg bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-lg shadow-primary/25 w-full sm:w-auto">
                        <LayoutDashboard className="mr-2 h-5 w-5" />
                        Go to Dashboard
                      </Button>
                    </motion.div>
                  </Link>
                </SignedIn>
              </motion.div>
            </motion.div>
          </div>

          {/* Abstract Background Elements */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -z-10"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 1 }}
            className="absolute bottom-0 right-0 translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-3xl -z-10"
          />
        </section>

        {/* Features Section */}
        <section className="w-full py-16 bg-muted/30">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className="grid gap-8 lg:grid-cols-3"
            >
              <FeatureCard
                icon={<Users className="h-10 w-10 text-primary" />}
                title="Create an invite-only place"
                description="Discord servers are organized into topic-based channels where you can collaborate, share, and just talk about your day without clogging up a group chat."
              />
              <FeatureCard
                icon={<Zap className="h-10 w-10 text-primary" />}
                title="Where hanging out is easy"
                description="Grab a seat in a voice channel when you're free. Friends in your server can see you're around and instantly pop in to talk without having to call."
              />
              <FeatureCard
                icon={<Shield className="h-10 w-10 text-primary" />}
                title="From few to a fandom"
                description="Get any community running with moderation tools and custom member access. Give members special powers, set up private channels, and more."
              />
            </motion.div>
          </div>
        </section>

        {/* Reliability Section */}
        <section className="w-full py-16 md:py-24 bg-background">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-10 lg:grid-cols-2 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Reliable tech for staying close
                </h2>
                <p className="text-muted-foreground text-lg">
                  Low-latency voice and video feels like you’re in the same room. Wave hello over video, watch friends stream their games, or gather up and have a drawing session with screen share.
                </p>
                <div className="pt-4">
                  <div className="relative w-full h-64 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl border border-primary/20 flex items-center justify-center overflow-hidden">
                    <Sparkles className="h-24 w-24 text-primary/40 animate-pulse" />
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                <div className="grid gap-4">
                  <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Globe className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl">Stay Connected</h3>
                      <p className="text-muted-foreground">Access your chats from your PC, Mac, or phone.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="p-2 bg-secondary/10 rounded-lg">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl">Join Communities</h3>
                      <p className="text-muted-foreground">Explore thousands of communities for your interests.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-16 bg-muted/30">
          <div className="container px-4 md:px-6 mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="space-y-6 max-w-3xl mx-auto"
            >
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Ready to start your journey?</h2>
              <SignedOut>
                <Link href="/sign-up">
                  <Button size="lg" className="h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full mt-4">
                    <Download className="mr-2 h-4 w-4" />
                    Download for Linux
                  </Button>
                </Link>
              </SignedOut>
              <SignedIn>
                <Link href={`/${userId}`}>
                  <Button size="lg" className="h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full mt-4">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Go to Dashboard
                  </Button>
                </Link>
              </SignedIn>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="py-10 bg-background border-t">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <h4 className="font-bold text-primary">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:underline">Download</Link></li>
                <li><Link href="#" className="hover:underline">Nitro</Link></li>
                <li><Link href="#" className="hover:underline">Status</Link></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-bold text-primary">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:underline">About</Link></li>
                <li><Link href="#" className="hover:underline">Jobs</Link></li>
                <li><Link href="#" className="hover:underline">Branding</Link></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-bold text-primary">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:underline">College</Link></li>
                <li><Link href="#" className="hover:underline">Support</Link></li>
                <li><Link href="#" className="hover:underline">Safety</Link></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-bold text-primary">Policies</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:underline">Terms</Link></li>
                <li><Link href="#" className="hover:underline">Privacy</Link></li>
                <li><Link href="#" className="hover:underline">Guidelines</Link></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-border/50">
            <div className="flex items-center gap-2 font-bold text-xl text-primary">
              <span>Discord</span>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              &copy; 2024 Discord Clone. Built by Arbaz Ansari.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="flex flex-col items-start space-y-4 p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div className="p-3 bg-background rounded-xl border border-border/50 shadow-sm">
        {icon}
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

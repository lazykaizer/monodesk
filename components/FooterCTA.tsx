import Link from "next/link";
import { MarqueeAnimation } from "@/components/ui/effects/marquee-effect";

export default function FooterCTA() {
    return (
        <section className="relative z-10 bg-background pb-24 px-4 md:px-8 overflow-hidden">
            <div className="max-w-7xl mx-auto">
                {/* Footer CTA */}
                <div className="text-center">
                    <div className="mt-0 mb-8 flex flex-col gap-0">
                        <MarqueeAnimation baseVelocity={-2} className="text-white" direction="left">
                            DESIGN STYLE ANALYTICS IMAGE VIDEO LOGO TREND PITCHDECK
                        </MarqueeAnimation>
                        <MarqueeAnimation baseVelocity={-2} className="text-white" direction="right">
                            DESIGN STYLE ANALYTICS IMAGE VIDEO LOGO TREND PITCHDECK
                        </MarqueeAnimation>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
                        Stop managing tools. <br />
                        <span className="text-gradient">Start building the future.</span>
                    </h2>

                    <div className="flex justify-center gap-6">
                        <Link href="/login" className="bg-white text-black px-10 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform">
                            Login
                        </Link>
                        <Link href="/signup" className="border border-white/20 bg-white/5 backdrop-blur-sm text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-white/10 hover:scale-105 transition-all">
                            Sign Up
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

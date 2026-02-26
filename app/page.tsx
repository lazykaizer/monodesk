import Link from "next/link";
import { AnimatedHero } from "@/components/ui/animated-hero";
import MonodeskHero from "@/components/MonodeskHero";
import FooterCTA from "@/components/FooterCTA";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-accent-purple/30 relative">

      {/* Scrollytelling Section (400vh) */}
      <MonodeskHero />

      {/* Hero Section */}
      <AnimatedHero />

      {/* Footer CTA */}
      <FooterCTA />

      {/* Simple Footer */}

      {/* Simple Footer */}
      <footer className="py-8 mx-auto max-w-7xl relative z-10 flex flex-col items-center gap-4 border-t border-white/5">
        <div className="text-white/80 text-xs uppercase tracking-widest">
          Monodesk Inc. © 2026. made by gulfam with love.
        </div>
        <div className="flex gap-6 text-sm font-mono text-gray-500">
          <Link href="/legal/terms" className="hover:text-white transition-colors">
            Terms <span className="text-xs bg-white/10 px-1 rounded ml-1">v1.2</span>
          </Link>
          <Link href="/legal/privacy" className="hover:text-white transition-colors">
            Privacy <span className="text-xs bg-green-500/10 text-green-400 px-1 rounded ml-1">Secure</span>
          </Link>
        </div>
      </footer>

    </main>
  );
}

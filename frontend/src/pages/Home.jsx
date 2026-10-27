import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, ShieldCheck } from "lucide-react";
import { Art } from "@/components/Art";
import { TopBar } from "@/components/TopBar";
import { UnlockButton } from "@/components/UnlockButton";

export default function Home() {
  return (
    <div className="min-h-screen blob-bg flex flex-col">
      <TopBar />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-12 grid md:grid-cols-[1.1fr_1fr] gap-8 md:gap-12 items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="order-2 md:order-1 text-center md:text-left">
          <span className="inline-block rounded-full bg-[#F6BC35] text-[#174B50] text-xs sm:text-sm font-bold uppercase tracking-wider px-4 py-1.5 mb-4" data-testid="demo-mode-badge">
            Demo-Modus · kostenlos
          </span>
          <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.05] text-[#174B50]">
            <span lang="es" className="text-[#169CA3]">¡Hola!</span> Sing & Play
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-[#4B767A] max-w-md mx-auto md:mx-0">
            Spanisch lernen mit Bailina und Capi – mit Liedern und kleinen Spielen.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Link to="/welten" className="btn btn-coral pulse-cta !min-h-[76px] !px-10 !text-2xl" data-testid="play-now-btn">
              <Play className="w-8 h-8 fill-white" /> Jetzt spielen
            </Link>
          </div>
          <div className="mt-6 flex justify-center md:justify-start">
            <UnlockButton className="btn-ghost" />
          </div>
          <p className="mt-8 flex items-center gap-2 justify-center md:justify-start text-sm text-[#4B767A]" data-testid="privacy-note">
            <ShieldCheck className="w-5 h-5 text-[#169CA3]" /> Ohne Konto · keine Werbung · kein Tracking
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }} className="order-1 md:order-2 relative mx-auto w-full max-w-[340px] sm:max-w-[400px]">
          <div className="absolute inset-6 rounded-full bg-[#169CA3]/15" />
          <Art imageKey="bailina" icon="Smile" label="Bailina" className="floaty relative aspect-[3/4] rounded-[40px] border-[6px] border-white shadow-[0_20px_50px_rgba(23,75,80,0.18)]" testId="home-bailina-art" />
          <Art imageKey="capi" icon="Smile" label="Capi" className="absolute -bottom-6 -left-4 sm:-left-10 w-28 h-28 sm:w-36 sm:h-36 rounded-full border-[6px] border-white shadow-xl" testId="home-capi-art" />
        </motion.div>
      </main>
    </div>
  );
}

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, ArrowRight } from "lucide-react";
import { Art } from "@/components/Art";
import { TopBar } from "@/components/TopBar";
import { useContent } from "@/context/ContentContext";
import { UnlockButton } from "@/components/UnlockButton";

export default function Worlds() {
  const { data, error } = useContent();
  const worlds = data?.worlds || [];
  return (
    <div className="min-h-screen blob-bg">
      <TopBar back="/" backLabel="Start" title="Wähle eine Welt" />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {error && <p className="text-[#F36F5B] mb-4" data-testid="content-error">{error}</p>}
        {!data && !error && <p className="font-display text-xl" data-testid="worlds-loading">Einen Moment …</p>}
        <div className="grid sm:grid-cols-2 gap-6">
          {worlds.map((w, i) => (
            <motion.div key={w.slug} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Link to={`/welt/${w.slug}`} className="tap-card card-soft block overflow-hidden" data-testid={`world-card-${w.slug}`}>
                <Art imageKey={w.words?.[0]?.image_key} icon={w.icon} label={w.title} className="aspect-[16/10]" />
                <div className="p-5 sm:p-6 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-display font-bold text-2xl sm:text-3xl leading-tight">{w.title}</h2>
                    <p className="text-[#4B767A] mt-1">{w.subtitle}</p>
                    {!w.published && <span className="inline-block mt-2 text-xs font-bold bg-[#FF9800] text-white rounded-full px-2 py-1">Nicht veröffentlicht</span>}
                  </div>
                  <span className="shrink-0 w-16 h-16 rounded-full bg-[#F36F5B] text-white flex items-center justify-center shadow-[0_5px_0_#C9503E]">
                    <ArrowRight className="w-8 h-8" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
          {data && (
            <div className="card-soft p-6 flex flex-col items-center justify-center text-center gap-4 border-dashed min-h-[240px] bg-white/60" data-testid="world-card-locked">
              <span className="w-16 h-16 rounded-full bg-[#FEF3D6] flex items-center justify-center"><Lock className="w-8 h-8 text-[#F6BC35]" /></span>
              <p className="font-display text-xl">Weitere Welten kommen bald</p>
              <UnlockButton />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

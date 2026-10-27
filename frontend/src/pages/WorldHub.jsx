import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Image as ImageIcon, Puzzle, ListOrdered, Music, Printer, CheckCircle2 } from "lucide-react";
import { Art } from "@/components/Art";
import { TopBar } from "@/components/TopBar";
import { Bilingual } from "@/components/Bilingual";
import { AudioButton } from "@/components/AudioButton";
import { WorldMissing } from "@/components/GameShell";
import { useWorld } from "@/context/ContentContext";
import { getProgress, markHeard } from "@/lib/progress";

const TILES = [
  { path: "bild", game: "picture", title: "Bild finden", hint: "Tippe das richtige Bild", Icon: ImageIcon, color: "#169CA3" },
  { path: "paare", game: "pairs", title: "Paare finden", hint: "Spanisch + Deutsch", Icon: Puzzle, color: "#F36F5B" },
  { path: "reihenfolge", game: "order", title: "Geschichte ordnen", hint: "Was kommt zuerst?", Icon: ListOrdered, color: "#F6BC35" },
];

export default function WorldHub() {
  const { slug } = useParams();
  const { world, loading } = useWorld(slug);
  if (!world) return <WorldMissing loading={loading} />;
  const progress = getProgress()[slug]?.games || {};

  return (
    <div className="min-h-screen blob-bg">
      <TopBar back="/welten" backLabel="Welten" />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-10">
        <section className="card-soft p-5 sm:p-8 grid sm:grid-cols-[200px_1fr] gap-6 items-start" data-testid="welcome-section">
          <Art imageKey="bailina" icon="Smile" label="Bailina" className="w-40 sm:w-full mx-auto aspect-[3/4] rounded-3xl" />
          <div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl mb-4">{world.title}</h1>
            <div className="relative rounded-3xl bg-[#D4F2EE] p-5 space-y-3" data-testid="welcome-captions">
              {world.welcome.lines.map((l, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.15 }}>
                  <Bilingual es={l.es} de={l.de} testId={`welcome-line-${i}`} />
                </motion.div>
              ))}
            </div>
            <div className="mt-5">
              <AudioButton src={world.welcome.audio_url} label="Bailina anhören" onPlay={() => markHeard(slug, "welcome")} testId="welcome-audio-btn" />
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-display font-bold text-2xl sm:text-3xl mb-4">Spiele</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {TILES.map(({ path, game, title, hint, Icon, color }, i) => (
              <motion.div key={path} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}>
                <Link to={`/welt/${slug}/${path}`} className="tap-card card-soft p-5 flex sm:flex-col items-center sm:items-start gap-4 min-h-[120px] relative" data-testid={`game-tile-${game}`}>
                  <span className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl flex items-center justify-center" style={{ background: color }}>
                    <Icon className="w-9 h-9 sm:w-11 sm:h-11 text-white" />
                  </span>
                  <div>
                    <p className="font-display font-bold text-xl sm:text-2xl">{title}</p>
                    <p className="text-[#4B767A]">{hint}</p>
                  </div>
                  {progress[game] && <CheckCircle2 className="absolute top-4 right-4 w-8 h-8 text-[#4CAF50]" data-testid={`game-done-${game}`} />}
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="grid sm:grid-cols-2 gap-5">
          <Link to={`/welt/${slug}/lied`} className="tap-card card-soft p-5 flex items-center gap-4 min-h-[110px]" data-testid="song-tile">
            <span className="w-16 h-16 rounded-full bg-[#F36F5B] flex items-center justify-center shrink-0"><Music className="w-8 h-8 text-white" /></span>
            <div>
              <p className="font-display font-bold text-xl sm:text-2xl" lang="es">{world.song.title_es}</p>
              <p className="text-[#4B767A]">{world.song.title_de} · Lied</p>
            </div>
          </Link>
          <Link to={`/welt/${slug}/drucken`} className="tap-card card-soft p-5 flex items-center gap-4 min-h-[110px]" data-testid="print-tile">
            <span className="w-16 h-16 rounded-full bg-[#F6BC35] flex items-center justify-center shrink-0"><Printer className="w-8 h-8 text-[#174B50]" /></span>
            <div>
              <p className="font-display font-bold text-xl sm:text-2xl">Malblatt</p>
              <p className="text-[#4B767A]">Zum Ausdrucken – passt zum Booklet</p>
            </div>
          </Link>
        </section>
      </main>
    </div>
  );
}

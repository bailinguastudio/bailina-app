import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Pause, VolumeX, Printer } from "lucide-react";
import { Art } from "@/components/Art";
import { Bilingual } from "@/components/Bilingual";
import { GameShell, useGameWorld, WorldMissing } from "@/components/GameShell";
import { mediaUrl } from "@/lib/api";
import { markHeard } from "@/lib/progress";

const fmt = (s) => (isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");

function Player({ src, onPlay }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(0);

  useEffect(() => () => ref.current?.pause(), []);

  if (!src) {
    return (
      <div className="flex items-center gap-4 rounded-full bg-[#174B50]/5 p-3 pr-6" data-testid="song-player-disabled">
        <span className="w-16 h-16 rounded-full bg-white flex items-center justify-center"><VolumeX className="w-7 h-7 text-[#4B767A]" /></span>
        <p className="text-[#4B767A]">Das Lied kommt bald. Ihr könnt den Text schon mitlesen und mitsingen!</p>
      </div>
    );
  }

  const toggle = () => {
    if (playing) ref.current.pause();
    else ref.current.play().then(onPlay).catch(() => {});
  };

  return (
    <div className="flex items-center gap-4 rounded-full bg-[#D4F2EE] p-3 pr-6" data-testid="song-player">
      <audio ref={ref} src={mediaUrl(src)} preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setT(e.target.currentTime)} onLoadedMetadata={(e) => setDur(e.target.duration)} />
      <button onClick={toggle} className="btn btn-coral !min-h-[64px] !w-16 !px-0 shrink-0" data-testid="song-play-btn" aria-label={playing ? "Pause" : "Abspielen"}>
        {playing ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 fill-white" />}
      </button>
      <input type="range" min={0} max={dur || 0} step={0.1} value={t} onChange={(e) => (ref.current.currentTime = Number(e.target.value))}
        className="flex-1 accent-[#169CA3] h-2" aria-label="Position" data-testid="song-seek" />
      <span className="text-sm tabular-nums w-20 text-right">{fmt(t)} / {fmt(dur)}</span>
    </div>
  );
}

export default function SongPage() {
  const { slug, world, loading } = useGameWorld();
  if (!world) return <WorldMissing loading={loading} />;
  const { song } = world;
  return (
    <GameShell title="Lied">
      <section className="card-soft p-5 sm:p-8 grid md:grid-cols-[220px_1fr] gap-6 items-start">
        <Art imageKey="bailina" icon="Music" label="Bailina" className="w-40 md:w-full mx-auto aspect-[3/4] rounded-3xl" />
        <div className="space-y-6">
          <div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-[#169CA3]" lang="es" data-testid="song-title-es">{song.title_es}</h1>
            <p className="text-xl">{song.title_de}</p>
          </div>
          <Player src={song.audio_url} onPlay={() => markHeard(slug, "song")} />
          <div className="rounded-3xl bg-[#FEF3D6] p-5 space-y-3" data-testid="song-lyrics">
            {song.lines.map((l, i) => <Bilingual key={i} es={l.es} de={l.de} testId={`song-line-${i}`} />)}
          </div>
        </div>
      </section>
      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
        <Link to={`/welt/${slug}/drucken`} className="btn btn-sun" data-testid="song-print-link"><Printer className="w-5 h-5" /> Malblatt drucken</Link>
        <Link to={`/welt/${slug}`} className="btn btn-turq" data-testid="song-back-world">Zurück zur Welt</Link>
      </div>
    </GameShell>
  );
}

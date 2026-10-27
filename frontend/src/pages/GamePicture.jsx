import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Art } from "@/components/Art";
import { AudioButton } from "@/components/AudioButton";
import { Celebration } from "@/components/Celebration";
import { GameShell, useGameWorld, WorldMissing, ProgressDots, Feedback } from "@/components/GameShell";
import { shuffle } from "@/lib/api";
import { recordGame } from "@/lib/progress";

const ROUNDS = 5;

function buildRounds(words) {
  return shuffle(words).slice(0, ROUNDS).map((target) => ({
    target,
    options: shuffle([target, ...shuffle(words.filter((w) => w.id !== target.id)).slice(0, 2)]),
  }));
}

export default function GamePicture() {
  const { slug, world, loading } = useGameWorld();
  const navigate = useNavigate();
  const [seed, setSeed] = useState(0);
  const rounds = useMemo(() => (world ? buildRounds(world.words) : []), [world, seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const [idx, setIdx] = useState(0);
  const [wrong, setWrong] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [done, setDone] = useState(false);

  if (!world) return <WorldMissing loading={loading} />;
  if (world.words.length < 3) return <WorldMissing />;
  const round = rounds[idx];

  const restart = () => {
    setSeed((s) => s + 1);
    setIdx(0);
    setWrong([]);
    setFeedback(null);
    setDone(false);
  };

  const pick = (w) => {
    if (feedback === "ok") return;
    if (w.id !== round.target.id) {
      setWrong((x) => [...x, w.id]);
      setFeedback("try");
      return;
    }
    setFeedback("ok");
    setTimeout(() => {
      setWrong([]);
      setFeedback(null);
      if (idx + 1 >= rounds.length) {
        recordGame(slug, "picture", rounds.map((r) => r.target.id));
        setDone(true);
      } else setIdx(idx + 1);
    }, 1000);
  };

  return (
    <GameShell title="Bild finden">
      <ProgressDots total={rounds.length} current={done ? rounds.length : idx} />
      <motion.div key={idx} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-soft mt-6 p-5 sm:p-7 flex flex-col sm:flex-row items-center gap-4 justify-between" data-testid="picture-prompt">
        <div className="text-center sm:text-left">
          <p className="text-sm uppercase tracking-wider font-bold text-[#4B767A]">Finde das Bild</p>
          <p className="font-display font-bold text-4xl sm:text-5xl text-[#169CA3]" lang="es" data-testid="picture-prompt-es">{round.target.es}</p>
          <p className="text-xl text-[#174B50]" data-testid="picture-prompt-de">= {round.target.de}</p>
        </div>
        <AudioButton src={round.target.audio_url} testId="picture-word-audio-btn" />
      </motion.div>
      <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-6">
        {round.options.map((w) => {
          const isWrong = wrong.includes(w.id);
          const isRight = feedback === "ok" && w.id === round.target.id;
          return (
            <button
              key={`${idx}-${w.id}`}
              onClick={() => pick(w)}
              className={`tap-card card-soft overflow-hidden p-0 ${isWrong ? "wiggle opacity-50" : ""} ${isRight ? "!border-[#4CAF50] ring-4 ring-[#4CAF50]/40" : ""}`}
              data-testid={`picture-option-${w.id}`}
              aria-label={w.de}
            >
              <Art imageKey={w.image_key} icon={w.icon} label={w.de} className="aspect-square" />
            </button>
          );
        })}
      </div>
      <div className="mt-6"><Feedback state={feedback} /></div>
      <Celebration open={done} onRetry={restart} onNext={() => navigate(`/welt/${slug}/paare`)} nextLabel="Nächstes Spiel" />
    </GameShell>
  );
}

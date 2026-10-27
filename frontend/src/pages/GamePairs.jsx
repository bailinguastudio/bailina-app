import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Celebration } from "@/components/Celebration";
import { GameShell, useGameWorld, WorldMissing, Feedback } from "@/components/GameShell";
import { Art } from "@/components/Art";
import { shuffle } from "@/lib/api";
import { recordGame } from "@/lib/progress";

const PAIRS = 4;

function PairCard({ word, lang, state, onClick }) {
  const base = "tap-card card-soft w-full min-h-[88px] sm:min-h-[104px] px-3 py-3 flex items-center gap-3 text-left";
  const look = state === "matched" ? "!border-[#4CAF50] bg-[#E8F7EE]" : state === "selected" ? "!border-[#169CA3] ring-4 ring-[#169CA3]/30" : state === "wrong" ? "wiggle !border-[#F6BC35]" : "";
  return (
    <button onClick={onClick} disabled={state === "matched"} className={`${base} ${look}`} data-testid={`pair-card-${lang}-${word.id}`}>
      {lang === "de" && <Art imageKey={word.image_key} icon={word.icon} label={word.de} className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shrink-0" />}
      <span className={`font-display font-bold text-lg sm:text-2xl leading-tight flex-1 break-words ${lang === "es" ? "text-[#169CA3]" : "text-[#174B50]"}`} lang={lang}>
        {lang === "es" ? word.es : word.de}
      </span>
      {state === "matched" && <CheckCircle2 className="w-7 h-7 text-[#4CAF50] shrink-0" />}
    </button>
  );
}

export default function GamePairs() {
  const { slug, world, loading } = useGameWorld();
  const navigate = useNavigate();
  const [seed, setSeed] = useState(0);
  const set = useMemo(() => (world ? shuffle(world.words).slice(0, PAIRS) : []), [world, seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const left = useMemo(() => shuffle(set), [set]);
  const right = useMemo(() => shuffle(set), [set]);
  const [sel, setSel] = useState(null);
  const [matched, setMatched] = useState([]);
  const [wrong, setWrong] = useState(null);
  const [feedback, setFeedback] = useState(null);

  if (!world) return <WorldMissing loading={loading} />;
  const done = set.length > 0 && matched.length === set.length;

  const restart = () => {
    setSeed((s) => s + 1);
    setSel(null);
    setMatched([]);
    setWrong(null);
    setFeedback(null);
  };

  const tap = (lang, word) => {
    if (!sel || sel.lang === lang) {
      setSel({ lang, id: word.id });
      setWrong(null);
      return;
    }
    if (sel.id === word.id) {
      const next = [...matched, word.id];
      setMatched(next);
      setFeedback("ok");
      if (next.length === set.length) recordGame(slug, "pairs", set.map((w) => w.id));
    } else {
      setWrong({ [sel.lang]: sel.id, [lang]: word.id });
      setFeedback("try");
    }
    setSel(null);
  };

  const stateOf = (lang, id) =>
    matched.includes(id) ? "matched" : sel?.lang === lang && sel.id === id ? "selected" : wrong?.[lang] === id ? "wrong" : "idle";

  return (
    <GameShell title="Paare finden">
      <p className="text-center text-lg sm:text-xl mb-6">Tippe ein spanisches Wort – und dann das deutsche Wort dazu.</p>
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        <div className="space-y-3 sm:space-y-4">
          <p className="text-center text-sm font-bold uppercase tracking-wider text-[#169CA3]">Español</p>
          {left.map((w) => <PairCard key={`es-${w.id}`} word={w} lang="es" state={stateOf("es", w.id)} onClick={() => tap("es", w)} />)}
        </div>
        <div className="space-y-3 sm:space-y-4">
          <p className="text-center text-sm font-bold uppercase tracking-wider text-[#F36F5B]">Deutsch</p>
          {right.map((w) => <PairCard key={`de-${w.id}`} word={w} lang="de" state={stateOf("de", w.id)} onClick={() => tap("de", w)} />)}
        </div>
      </div>
      <div className="mt-6"><Feedback state={feedback} /></div>
      <Celebration open={done} onRetry={restart} onNext={() => navigate(`/welt/${slug}/reihenfolge`)} nextLabel="Nächstes Spiel" />
    </GameShell>
  );
}

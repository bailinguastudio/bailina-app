import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import { Art } from "@/components/Art";
import { Bilingual } from "@/components/Bilingual";
import { Celebration } from "@/components/Celebration";
import { GameShell, useGameWorld, WorldMissing } from "@/components/GameShell";
import { shuffle } from "@/lib/api";
import { recordGame } from "@/lib/progress";

function scrambled(n) {
  const order = [...Array(n).keys()];
  if (n < 2) return order;
  let s = shuffle(order);
  while (s.every((v, i) => v === i)) s = shuffle(order);
  return s;
}

export default function GameOrder() {
  const { slug, world, loading } = useGameWorld();
  const navigate = useNavigate();
  const steps = world?.story?.steps || [];
  const [seed, setSeed] = useState(0);
  const pool0 = useMemo(() => scrambled(steps.length), [steps.length, seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const [placed, setPlaced] = useState([]);
  const [done, setDone] = useState(false);

  if (!world) return <WorldMissing loading={loading} />;
  const pool = pool0.filter((i) => !placed.includes(i));
  const full = steps.length > 0 && placed.length === steps.length;
  const correct = full && placed.every((v, i) => v === i);

  const place = (i) => {
    const next = [...placed, i];
    setPlaced(next);
    if (next.length === steps.length && next.every((v, k) => v === k)) {
      recordGame(slug, "order");
      setTimeout(() => setDone(true), 600);
    }
  };
  const restart = () => {
    setSeed((s) => s + 1);
    setPlaced([]);
    setDone(false);
  };

  return (
    <GameShell title="Geschichte ordnen">
      <div className="text-center mb-6">
        <p className="font-display font-bold text-2xl sm:text-3xl text-[#169CA3]" lang="es">{world.story.title_es}</p>
        <p className="text-lg">{world.story.title_de} – Was passiert zuerst? Tippe die Bilder der Reihe nach.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4" data-testid="order-slots">
        {steps.map((_, slot) => {
          const i = placed[slot];
          const s = steps[i];
          return (
            <button
              key={slot}
              onClick={() => i !== undefined && !correct && setPlaced(placed.filter((p) => p !== i))}
              className={`relative rounded-[24px] border-4 border-dashed min-h-[150px] sm:min-h-[210px] flex flex-col overflow-hidden text-left ${s ? (correct ? "border-[#4CAF50] bg-white" : "border-[#169CA3] bg-white") : "border-[#174B50]/20 bg-white/50"}`}
              data-testid={`order-slot-${slot}`}
            >
              <span className="absolute top-2 left-2 z-10 w-9 h-9 rounded-full bg-[#F6BC35] font-display font-bold text-lg flex items-center justify-center shadow">{slot + 1}</span>
              {s && (
                <>
                  <Art imageKey={s.image_key} icon={s.icon} label={s.de} className="aspect-[4/3]" />
                  <div className="p-2"><Bilingual es={s.es} de={s.de} /></div>
                </>
              )}
            </button>
          );
        })}
      </div>

      {full && !correct && (
        <div className="mt-6 card-soft p-5 flex flex-col sm:flex-row items-center gap-4 justify-between bg-[#FEF3D6]" data-testid="order-try-again">
          <p className="font-display text-xl">Fast geschafft! Schau nochmal genau hin.</p>
          <button className="btn btn-turq" onClick={() => setPlaced([])} data-testid="order-retry-btn"><RotateCcw className="w-5 h-5" /> Nochmal ordnen</button>
        </div>
      )}

      {pool.length > 0 && (
        <>
          <p className="mt-8 mb-3 text-center text-sm font-bold uppercase tracking-wider text-[#4B767A]">Bilder</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4" data-testid="order-pool">
            {pool.map((i) => (
              <button key={i} onClick={() => place(i)} className="tap-card card-soft overflow-hidden text-left" data-testid={`order-card-${i}`}>
                <Art imageKey={steps[i].image_key} icon={steps[i].icon} label={steps[i].de} className="aspect-[4/3]" />
                <div className="p-2"><Bilingual es={steps[i].es} de={steps[i].de} /></div>
              </button>
            ))}
          </div>
        </>
      )}

      <Celebration open={done} onRetry={restart} onNext={() => navigate(`/welt/${slug}/lied`)} nextLabel="Zum Lied">
        <div className="text-left rounded-2xl bg-[#D4F2EE] p-4 space-y-2">
          {steps.map((s, i) => <Bilingual key={i} es={`${i + 1}. ${s.es}`} de={s.de} />)}
        </div>
      </Celebration>
    </GameShell>
  );
}

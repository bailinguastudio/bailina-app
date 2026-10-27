import { useMemo } from "react";
import { Printer } from "lucide-react";
import { Art } from "@/components/Art";
import { GameShell, useGameWorld, WorldMissing } from "@/components/GameShell";
import { shuffle } from "@/lib/api";

export default function PrintPage() {
  const { world, loading } = useGameWorld();
  const words = useMemo(() => (world ? world.words.slice(0, 6) : []), [world]);
  const germanShuffled = useMemo(() => shuffle(words), [words]);
  if (!world) return <WorldMissing loading={loading} />;
  const { activity } = world;

  return (
    <GameShell title="Malblatt">
      <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <p className="text-[#4B767A]">Drucken oder im Druckdialog „Als PDF speichern“ wählen.</p>
        <button className="btn btn-coral" onClick={() => window.print()} data-testid="print-activity-btn"><Printer className="w-5 h-5" /> Drucken / PDF</button>
      </div>
      <article className="print-sheet bg-white rounded-3xl shadow-xl p-6 sm:p-10 max-w-[800px] mx-auto text-[#174B50]" data-testid="print-sheet">
        <header className="flex items-start justify-between gap-4 border-b-4 border-[#169CA3] pb-4">
          <div>
            <h1 className="font-display font-bold text-3xl">{activity.title}</h1>
            <p className="text-sm mt-1">{activity.booklet_ref}</p>
          </div>
          <Art imageKey="capi" icon="Smile" label="Capi" className="w-20 h-20 rounded-full shrink-0" />
        </header>
        <ol className="list-decimal pl-6 mt-5 space-y-1 text-lg">
          {activity.tasks.map((t, i) => <li key={i}>{t}</li>)}
        </ol>
        <section className="mt-6 grid grid-cols-2 gap-x-16 gap-y-5" data-testid="print-connect">
          {words.map((w, i) => (
            <div key={w.id} className="contents">
              <div className="flex items-center justify-between rounded-2xl border-2 border-[#169CA3] px-4 py-3">
                <span className="font-display font-bold text-xl" lang="es">{w.es}</span><span className="w-3 h-3 rounded-full bg-[#169CA3]" />
              </div>
              <div className="flex items-center gap-3 rounded-2xl border-2 border-[#F36F5B] px-4 py-3">
                <span className="w-3 h-3 rounded-full bg-[#F36F5B]" /><span className="font-display text-xl">{germanShuffled[i].de}</span>
              </div>
            </div>
          ))}
        </section>
        <section className="mt-8">
          <p className="font-display font-bold text-xl mb-2">Male hier Bailina und Capi:</p>
          <div className="h-56 rounded-3xl border-4 border-dashed border-[#174B50]/25" />
        </section>
        <footer className="mt-6 text-xs text-[#4B767A]">Bailina Sing & Play · Lösungen: {words.map((w) => `${w.es} = ${w.de}`).join(" · ")}</footer>
      </article>
    </GameShell>
  );
}

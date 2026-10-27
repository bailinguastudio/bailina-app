import { Link, useParams } from "react-router-dom";
import { useWorld } from "@/context/ContentContext";
import { TopBar } from "@/components/TopBar";

export function GameShell({ title, children }) {
  const { slug } = useParams();
  return (
    <div className="min-h-screen blob-bg">
      <TopBar back={`/welt/${slug}`} backLabel="Zur Welt" title={title} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">{children}</main>
    </div>
  );
}

export function useGameWorld() {
  const { slug } = useParams();
  return { slug, ...useWorld(slug) };
}

export function WorldMissing({ loading }) {
  return (
    <div className="min-h-screen blob-bg flex flex-col items-center justify-center gap-6 p-6 text-center" data-testid="world-missing">
      <p className="font-display text-2xl">{loading ? "Einen Moment …" : "Diese Welt gibt es noch nicht."}</p>
      {!loading && (
        <Link to="/welten" className="btn btn-turq" data-testid="world-missing-back-btn">Zu den Welten</Link>
      )}
    </div>
  );
}

export function ProgressDots({ total, current }) {
  return (
    <div className="flex gap-2 justify-center" data-testid="game-progress">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`h-3 rounded-full transition-[width,background-color] duration-300 ${i < current ? "w-6 bg-[#169CA3]" : i === current ? "w-10 bg-[#F6BC35]" : "w-6 bg-[#174B50]/15"}`} />
      ))}
    </div>
  );
}

export function Feedback({ state }) {
  if (!state) return <div className="h-14" />;
  const ok = state === "ok";
  return (
    <div
      className={`h-14 flex items-center justify-center rounded-full px-6 font-display text-xl font-semibold ${ok ? "bg-[#D4F2EE] text-[#0F7378]" : "bg-[#FEF3D6] text-[#174B50]"}`}
      role="status"
      data-testid="game-feedback"
    >
      {ok ? "¡Sí! Richtig!" : "Fast! Versuch es nochmal."}
    </div>
  );
}

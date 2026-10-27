import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Lock, CheckCircle2, Circle, Printer, AlertTriangle, LogOut, Trash2, ShieldCheck } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { UnlockButton } from "@/components/UnlockButton";
import { useContent } from "@/context/ContentContext";
import { hasPin, setPin, checkPin, isUnlocked, setUnlocked, getProgress, resetProgress, clearPinAndProgress } from "@/lib/progress";

function PinGate({ onOpen }) {
  const creating = !hasPin();
  const [pin, setPinVal] = useState("");
  const [pin2, setPin2] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin)) return toast.error("Bitte 4 Ziffern eingeben");
    setBusy(true);
    if (creating) {
      if (pin !== pin2) {
        setBusy(false);
        return toast.error("Die PINs stimmen nicht überein");
      }
      await setPin(pin);
      toast.success("PIN gespeichert");
      onOpen();
    } else if (await checkPin(pin)) onOpen();
    else toast.error("PIN ist nicht richtig");
    setBusy(false);
    setPinVal("");
  };

  const forgot = () => {
    if (window.confirm("PIN zurücksetzen? Dabei wird auch der Lernfortschritt auf diesem Gerät gelöscht.")) {
      clearPinAndProgress();
      window.location.reload();
    }
  };

  const field = "w-full text-center tracking-[0.6em] font-display text-3xl rounded-2xl border-4 border-[#169CA3]/30 focus:border-[#169CA3] outline-none py-3 bg-white";
  return (
    <form onSubmit={submit} className="card-soft max-w-sm mx-auto p-6 sm:p-8 space-y-4 text-center" data-testid="parent-pin-form">
      <span className="w-16 h-16 mx-auto rounded-full bg-[#D4F2EE] flex items-center justify-center"><Lock className="w-8 h-8 text-[#169CA3]" /></span>
      <h1 className="font-display font-bold text-2xl">{creating ? "Eltern-PIN festlegen" : "Eltern-Bereich"}</h1>
      <p className="text-[#4B767A] text-sm">{creating ? "Wählen Sie einen 4-stelligen PIN. Er wird nur verschlüsselt auf diesem Gerät gespeichert." : "Bitte geben Sie Ihren 4-stelligen PIN ein."}</p>
      <input className={field} inputMode="numeric" type="password" maxLength={4} autoComplete="off" value={pin} onChange={(e) => setPinVal(e.target.value.replace(/\D/g, ""))} placeholder="••••" aria-label="PIN" data-testid="parent-pin-input" />
      {creating && <input className={field} inputMode="numeric" type="password" maxLength={4} autoComplete="off" value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, ""))} placeholder="••••" aria-label="PIN wiederholen" data-testid="parent-pin-confirm-input" />}
      <button className="btn btn-turq w-full" disabled={busy} data-testid="parent-pin-submit">{creating ? "PIN speichern" : "Öffnen"}</button>
      {!creating && <button type="button" onClick={forgot} className="text-sm underline text-[#4B767A]" data-testid="parent-pin-forgot">PIN vergessen?</button>}
    </form>
  );
}

function ParentDashboard({ onLock }) {
  const { data } = useContent();
  const [progress, setProgress] = useState(getProgress());
  const worlds = data?.worlds || [];

  return (
    <div className="space-y-8" data-testid="parent-dashboard">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display font-bold text-3xl sm:text-4xl">Eltern-Bereich</h1>
        <button className="btn btn-ghost text-base" onClick={onLock} data-testid="parent-lock-btn"><LogOut className="w-5 h-5" /> Sperren</button>
      </div>

      <div className="card-soft p-5 flex gap-4 bg-[#FEF3D6]" data-testid="parent-review-note">
        <AlertTriangle className="w-7 h-7 text-[#F6BC35] shrink-0" />
        <p>Hinweis: Alle spanischen Texte sollten vor der Veröffentlichung von einer Person mit fließenden Spanischkenntnissen geprüft werden. Inhalte mit „Platzhalter“ sind noch nicht final.</p>
      </div>

      {worlds.map((w) => {
        const p = progress[w.slug] || { games: {}, words: [] };
        return (
          <section key={w.slug} className="card-soft p-5 sm:p-7 space-y-5" data-testid={`parent-world-${w.slug}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display font-bold text-2xl">{w.title}</h2>
              <Link to={`/welt/${w.slug}/drucken`} className="btn btn-sun text-base" data-testid={`parent-print-${w.slug}`}><Printer className="w-5 h-5" /> Malblatt drucken / PDF</Link>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[["picture", "Bild finden"], ["pairs", "Paare finden"], ["order", "Geschichte"]].map(([k, label]) => (
                <div key={k} className="rounded-2xl bg-[#D4F2EE] p-3" data-testid={`parent-game-${k}`}>
                  <p className="font-display font-bold text-2xl">{p.games?.[k]?.plays || 0}×</p>
                  <p className="text-sm">{label}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="font-bold mb-2">Wortschatz ({(p.words || []).length} von {w.words.length} geübt)</p>
              <ul className="grid sm:grid-cols-2 gap-2" data-testid={`parent-vocab-${w.slug}`}>
                {w.words.map((word) => {
                  const done = (p.words || []).includes(word.id);
                  return (
                    <li key={word.id} className="flex items-center gap-3 rounded-2xl bg-[#FFF8EA] px-4 py-2">
                      {done ? <CheckCircle2 className="w-5 h-5 text-[#4CAF50] shrink-0" /> : <Circle className="w-5 h-5 text-[#174B50]/30 shrink-0" />}
                      <span><b lang="es">{word.es}</b> – {word.de}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        );
      })}

      <section className="card-soft p-5 sm:p-7 space-y-4">
        <p className="flex items-start gap-3"><ShieldCheck className="w-6 h-6 text-[#169CA3] shrink-0" /> Der Fortschritt wird nur auf diesem Gerät gespeichert. Es gibt keine Kinderkonten, keine Werbung und kein Tracking.</p>
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-ghost text-base" onClick={() => { if (window.confirm("Fortschritt auf diesem Gerät löschen?")) { resetProgress(); setProgress({}); toast.success("Fortschritt gelöscht"); } }} data-testid="parent-reset-progress-btn">
            <Trash2 className="w-5 h-5" /> Fortschritt löschen
          </button>
          <UnlockButton />
        </div>
      </section>
    </div>
  );
}

export default function Parent() {
  const [open, setOpen] = useState(isUnlocked());
  const unlock = () => { setUnlocked(true); setOpen(true); };
  const lock = () => { setUnlocked(false); setOpen(false); };
  return (
    <div className="min-h-screen blob-bg">
      <TopBar back="/" backLabel="Start" />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {open ? <ParentDashboard onLock={lock} /> : <PinGate onOpen={unlock} />}
      </main>
    </div>
  );
}

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";
import { api, formatApiError } from "@/lib/api";
import { ICON_NAMES } from "@/components/Art";
import { AudioField } from "@/components/admin/AudioField";
import { Section, LinesEditor, Check, inputCls } from "@/components/admin/Fields";

function ImageSelect({ value, images, onChange, testId }) {
  return (
    <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} data-testid={testId}>
      <option value="">– kein Bild –</option>
      {images.map((i) => <option key={i.key} value={i.key}>{i.label} ({i.status === "approved" ? "freigegeben" : i.status === "rejected" ? "abgelehnt" : "zur Freigabe"})</option>)}
    </select>
  );
}

function IconSelect({ value, onChange }) {
  return (
    <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} aria-label="Ersatz-Symbol">
      {ICON_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
    </select>
  );
}

export function WorldEditor({ world, images, onSaved }) {
  const [d, setD] = useState(world);
  const [saving, setSaving] = useState(false);
  const upd = (fn) => setD((prev) => { const c = structuredClone(prev); fn(c); return c; });

  const save = async (draft = d) => {
    setSaving(true);
    try {
      const { data } = await api.put(`/admin/worlds/${world.slug}`, draft);
      onSaved(data);
      toast.success("Gespeichert – für alle Familien sichtbar" + (data.published ? "" : " (sobald veröffentlicht)"));
    } catch (e) {
      toast.error(formatApiError(e));
    }
    setSaving(false);
  };
  const setAudioAndSave = (fn) => { const c = structuredClone(d); fn(c); setD(c); save(c); };
  const setWord = (i, k, v) => upd((c) => { c.words[i][k] = v; });
  const unreviewed = d.words.filter((w) => !w.reviewed).length;

  return (
    <div className="space-y-5 pb-28" data-testid="world-editor">
      <Section title="Allgemein">
        <div className="grid sm:grid-cols-2 gap-3">
          <input className={inputCls} value={d.title} onChange={(e) => upd((c) => { c.title = e.target.value; })} placeholder="Titel" data-testid="editor-title" />
          <input className={inputCls} value={d.subtitle} onChange={(e) => upd((c) => { c.subtitle = e.target.value; })} placeholder="Untertitel" data-testid="editor-subtitle" />
        </div>
        <div className="flex flex-wrap gap-6 items-center">
          <Check checked={d.published} onChange={(v) => upd((c) => { c.published = v; })} label="Veröffentlicht (für Familien sichtbar)" testId="editor-published" />
          <label className="text-sm font-bold flex items-center gap-2">Reihenfolge <input type="number" className={`${inputCls} w-20`} value={d.order} onChange={(e) => upd((c) => { c.order = Number(e.target.value); })} /></label>
        </div>
        <div className={`rounded-xl p-3 text-sm font-bold ${unreviewed ? "bg-[#FEF3D6]" : "bg-[#E8F7EE]"}`} data-testid="editor-review-status">
          {unreviewed ? `${unreviewed} Vokabel(n) noch nicht von Dari geprüft.` : "Alle Vokabeln geprüft."} {d.song.placeholder && "Liedtext ist Platzhalter."} {d.activity.placeholder && "Malblatt ist Platzhalter."}
        </div>
      </Section>

      <Section title="Begrüßung von Bailina" hint="Wird als Untertitel angezeigt. Audio optional.">
        <AudioField value={d.welcome.audio_url} onChange={(u) => setAudioAndSave((c) => { c.welcome.audio_url = u; })} testId="editor-welcome-audio" />
        <LinesEditor lines={d.welcome.lines} onChange={(l) => upd((c) => { c.welcome.lines = l; })} testPrefix="editor-welcome-line" />
      </Section>

      <Section title={`Vokabeln (${d.words.length})`} hint="Jedes spanische Wort braucht eine direkte deutsche Übersetzung. Das Symbol erscheint, solange kein Bild freigegeben ist.">
        <div className="space-y-3">
          {d.words.map((w, i) => (
            <div key={w.id} className={`rounded-xl border-2 p-3 space-y-2 ${w.placeholder ? "border-[#FF9800] bg-[#FFF5E6]" : "border-[#169CA3]/15"}`} data-testid={`editor-word-${i}`}>
              <div className="grid sm:grid-cols-4 gap-2">
                <input className={inputCls} value={w.es} placeholder="Spanisch" onChange={(e) => setWord(i, "es", e.target.value)} data-testid={`editor-word-es-${i}`} />
                <input className={inputCls} value={w.de} placeholder="Deutsch" onChange={(e) => setWord(i, "de", e.target.value)} data-testid={`editor-word-de-${i}`} />
                <ImageSelect value={w.image_key} images={images} onChange={(v) => setWord(i, "image_key", v)} testId={`editor-word-image-${i}`} />
                <IconSelect value={w.icon} onChange={(v) => setWord(i, "icon", v)} />
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Check checked={w.reviewed} onChange={(v) => setWord(i, "reviewed", v)} label="Spanisch geprüft" testId={`editor-word-reviewed-${i}`} />
                <Check checked={w.placeholder} onChange={(v) => setWord(i, "placeholder", v)} label="Platzhalter" testId={`editor-word-placeholder-${i}`} />
                <AudioField value={w.audio_url} onChange={(u) => setAudioAndSave((c) => { c.words[i].audio_url = u; })} testId={`editor-word-audio-${i}`} />
                <button type="button" onClick={() => upd((c) => { c.words.splice(i, 1); })} className="ml-auto text-sm flex items-center gap-1 text-[#C9503E]" data-testid={`editor-word-remove-${i}`}><Trash2 className="w-4 h-4" /> Löschen</button>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => upd((c) => { c.words.push({ id: Math.random().toString(36).slice(2, 10), es: "", de: "", image_key: "", icon: "Sparkles", audio_url: "", reviewed: false, placeholder: true }); })} className="text-sm font-bold flex items-center gap-1 text-[#169CA3]" data-testid="editor-word-add"><Plus className="w-4 h-4" /> Vokabel hinzufügen</button>
      </Section>

      <Section title="Mini-Geschichte (Spiel „Geschichte ordnen“)" hint="3–4 Bilder in der richtigen Reihenfolge.">
        <div className="grid sm:grid-cols-2 gap-2">
          <input className={inputCls} value={d.story.title_es} placeholder="Titel Spanisch" onChange={(e) => upd((c) => { c.story.title_es = e.target.value; })} />
          <input className={inputCls} value={d.story.title_de} placeholder="Titel Deutsch" onChange={(e) => upd((c) => { c.story.title_de = e.target.value; })} />
        </div>
        {d.story.steps.map((s, i) => (
          <div key={i} className="grid sm:grid-cols-[auto_1fr_1fr_1fr_auto] gap-2 items-center" data-testid={`editor-story-${i}`}>
            <span className="font-bold">{i + 1}.</span>
            <input className={inputCls} value={s.es} placeholder="Spanisch" onChange={(e) => upd((c) => { c.story.steps[i].es = e.target.value; })} />
            <input className={inputCls} value={s.de} placeholder="Deutsch" onChange={(e) => upd((c) => { c.story.steps[i].de = e.target.value; })} />
            <ImageSelect value={s.image_key} images={images} onChange={(v) => upd((c) => { c.story.steps[i].image_key = v; })} />
            <button type="button" onClick={() => upd((c) => { c.story.steps.splice(i, 1); })} className="p-2 text-[#C9503E]" aria-label="Schritt löschen"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        {d.story.steps.length < 4 && <button type="button" onClick={() => upd((c) => { c.story.steps.push({ es: "", de: "", image_key: "", icon: "Sparkles" }); })} className="text-sm font-bold flex items-center gap-1 text-[#169CA3]" data-testid="editor-story-add"><Plus className="w-4 h-4" /> Schritt hinzufügen</button>}
      </Section>

      <Section title="Lied">
        <div className="grid sm:grid-cols-2 gap-2">
          <input className={inputCls} value={d.song.title_es} placeholder="Titel Spanisch" onChange={(e) => upd((c) => { c.song.title_es = e.target.value; })} data-testid="editor-song-title-es" />
          <input className={inputCls} value={d.song.title_de} placeholder="Titel Deutsch" onChange={(e) => upd((c) => { c.song.title_de = e.target.value; })} />
        </div>
        <AudioField value={d.song.audio_url} onChange={(u) => setAudioAndSave((c) => { c.song.audio_url = u; })} testId="editor-song-audio" />
        <Check checked={d.song.placeholder} onChange={(v) => upd((c) => { c.song.placeholder = v; })} label="Liedtext ist Platzhalter" testId="editor-song-placeholder" />
        <LinesEditor lines={d.song.lines} onChange={(l) => upd((c) => { c.song.lines = l; })} testPrefix="editor-song-line" />
      </Section>

      <Section title="Malblatt (Druckseite)">
        <input className={inputCls} value={d.activity.title} placeholder="Titel" onChange={(e) => upd((c) => { c.activity.title = e.target.value; })} />
        <input className={inputCls} value={d.activity.booklet_ref} placeholder="Booklet-Bezug" onChange={(e) => upd((c) => { c.activity.booklet_ref = e.target.value; })} data-testid="editor-activity-ref" />
        <Check checked={d.activity.placeholder} onChange={(v) => upd((c) => { c.activity.placeholder = v; })} label="Platzhalter" />
        <textarea className={`${inputCls} min-h-[100px]`} value={d.activity.tasks.join("\n")} onChange={(e) => upd((c) => { c.activity.tasks = e.target.value.split("\n"); })} placeholder="Eine Aufgabe pro Zeile" />
      </Section>

      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t-2 border-[#169CA3]/15 p-3">
        <div className="max-w-6xl mx-auto flex justify-end">
          <button className="btn btn-coral" disabled={saving} onClick={() => save()} data-testid="editor-save-btn"><Save className="w-5 h-5" /> {saving ? "Speichert …" : "Änderungen speichern"}</button>
        </div>
      </div>
    </div>
  );
}

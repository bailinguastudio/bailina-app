import { Plus, Trash2 } from "lucide-react";

export const inputCls = "w-full rounded-xl border-2 border-[#169CA3]/25 focus:border-[#169CA3] outline-none px-3 py-2 bg-white text-sm";

export function Section({ title, children, hint }) {
  return (
    <section className="bg-white rounded-2xl border-2 border-[#169CA3]/10 p-4 sm:p-6 space-y-4">
      <div>
        <h3 className="font-display font-bold text-xl">{title}</h3>
        {hint && <p className="text-sm text-[#4B767A]">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export function LinesEditor({ lines, onChange, testPrefix }) {
  const set = (i, k, v) => onChange(lines.map((l, j) => (j === i ? { ...l, [k]: v } : l)));
  return (
    <div className="space-y-2">
      {lines.map((l, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <input className={inputCls} value={l.es} placeholder="Spanisch" onChange={(e) => set(i, "es", e.target.value)} data-testid={`${testPrefix}-es-${i}`} />
          <input className={inputCls} value={l.de} placeholder="Deutsch" onChange={(e) => set(i, "de", e.target.value)} data-testid={`${testPrefix}-de-${i}`} />
          <button type="button" onClick={() => onChange(lines.filter((_, j) => j !== i))} className="p-2 text-[#C9503E]" aria-label="Zeile löschen" data-testid={`${testPrefix}-remove-${i}`}><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...lines, { es: "", de: "" }])} className="text-sm font-bold flex items-center gap-1 text-[#169CA3]" data-testid={`${testPrefix}-add`}><Plus className="w-4 h-4" /> Zeile hinzufügen</button>
    </div>
  );
}

export function Check({ checked, onChange, label, testId }) {
  return (
    <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-[#169CA3]" data-testid={testId} />
      {label}
    </label>
  );
}

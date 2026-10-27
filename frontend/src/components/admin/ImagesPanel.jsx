import { useRef, useState } from "react";
import { toast } from "sonner";
import { Check, X, Upload, Plus, RotateCcw } from "lucide-react";
import { api, formatApiError, mediaUrl } from "@/lib/api";
import { inputCls } from "@/components/admin/Fields";

const BADGE = {
  pending: ["Zur Freigabe", "bg-[#FF9800]"],
  approved: ["Freigegeben", "bg-[#2E7D32]"],
  rejected: ["Abgelehnt", "bg-[#C9503E]"],
};

function ImageCard({ img, onUpdate }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [label, cls] = BADGE[img.status] || BADGE.pending;

  const run = async (fn) => {
    setBusy(true);
    try {
      onUpdate((await fn()).data);
    } catch (e) {
      toast.error(formatApiError(e));
    }
    setBusy(false);
  };
  const setStatus = (status) => run(() => api.patch(`/admin/images/${img.key}`, { status }));
  const upload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    run(() => api.post(`/admin/images/${img.key}/upload`, fd)).then(() => toast.success("Bild hochgeladen – bitte freigeben"));
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-[#169CA3]/10 overflow-hidden flex flex-col" data-testid={`admin-image-${img.key}`}>
      <div className="relative aspect-square bg-[#FFF8EA]">
        {img.url ? <img src={mediaUrl(img.url)} alt={img.label} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-sm text-[#4B767A]">Noch kein Bild</div>}
        <span className={`absolute top-2 left-2 rounded-full text-white text-xs font-bold px-2 py-1 ${cls}`} data-testid={`admin-image-status-${img.key}`}>{label}</span>
        <span className="absolute bottom-2 left-2 rounded-full bg-white/90 text-[10px] font-bold px-2 py-0.5">{img.source === "generated" ? "KI-erzeugt" : "Hochgeladen"}</span>
      </div>
      <div className="p-3 space-y-2 flex-1 flex flex-col">
        <p className="font-bold text-sm">{img.label}</p>
        <p className="text-xs text-[#4B767A] font-mono">{img.key}</p>
        <div className="grid grid-cols-2 gap-2 mt-auto">
          {img.status !== "approved" ? (
            <button disabled={busy || !img.url} onClick={() => setStatus("approved")} className="rounded-full bg-[#2E7D32] text-white text-xs font-bold py-2 flex items-center justify-center gap-1 disabled:opacity-50" data-testid={`admin-image-approve-${img.key}`}><Check className="w-4 h-4" /> Freigeben</button>
          ) : (
            <button disabled={busy} onClick={() => setStatus("pending")} className="rounded-full border-2 border-[#FF9800] text-xs font-bold py-2 flex items-center justify-center gap-1" data-testid={`admin-image-unapprove-${img.key}`}><RotateCcw className="w-4 h-4" /> Zurückziehen</button>
          )}
          <button disabled={busy || img.status === "rejected"} onClick={() => setStatus("rejected")} className="rounded-full border-2 border-[#C9503E] text-[#C9503E] text-xs font-bold py-2 flex items-center justify-center gap-1 disabled:opacity-40" data-testid={`admin-image-reject-${img.key}`}><X className="w-4 h-4" /> Ablehnen</button>
        </div>
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={upload} data-testid={`admin-image-input-${img.key}`} />
        <button disabled={busy} onClick={() => input.current?.click()} className="rounded-full border-2 border-[#169CA3]/40 text-xs font-bold py-2 flex items-center justify-center gap-1" data-testid={`admin-image-upload-${img.key}`}><Upload className="w-4 h-4" /> Ersetzen</button>
      </div>
    </div>
  );
}

export function ImagesPanel({ images, setImages, onChanged }) {
  const [key, setKey] = useState("");
  const update = (img) => {
    setImages((list) => list.map((x) => (x.key === img.key ? img : x)));
    onChanged();
  };
  const add = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/admin/images", { key, label: key });
      setImages((l) => [...l, data]);
      setKey("");
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-[#FEF3D6] p-4 text-sm">
        Nur freigegebene Bilder erscheinen für Familien. Bilder „Zur Freigabe“ sehen nur angemeldete Betreiber in der Vorschau. Ein neu hochgeladenes Bild muss erneut freigegeben werden.
      </div>
      <form onSubmit={add} className="flex gap-2 max-w-md">
        <input className={inputCls} value={key} onChange={(e) => setKey(e.target.value)} placeholder="neuer Bild-Schlüssel, z. B. word_perro" data-testid="admin-new-image-key" />
        <button className="rounded-full bg-[#169CA3] text-white px-4 font-bold text-sm flex items-center gap-1 shrink-0" data-testid="admin-new-image-btn"><Plus className="w-4 h-4" /> Anlegen</button>
      </form>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((img) => <ImageCard key={img.key} img={img} onUpdate={update} />)}
      </div>
    </div>
  );
}

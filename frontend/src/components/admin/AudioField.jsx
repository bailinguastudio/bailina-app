import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Trash2, CheckCircle2 } from "lucide-react";
import { api, formatApiError, mediaUrl } from "@/lib/api";

export function AudioField({ value, onChange, testId }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/admin/audio", fd);
      onChange(data.url);
      toast.success(`MP3 hochgeladen: ${data.filename}`);
    } catch (err) {
      toast.error(formatApiError(err));
    }
    setBusy(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid={testId}>
      {value ? (
        <>
          <span className="flex items-center gap-1 text-sm font-bold text-[#2E7D32]"><CheckCircle2 className="w-4 h-4" /> MP3 vorhanden</span>
          <audio controls preload="none" src={mediaUrl(value)} className="h-9 max-w-[220px]" />
          <button type="button" onClick={() => onChange("")} className="text-sm flex items-center gap-1 text-[#C9503E]" data-testid={`${testId}-remove`}><Trash2 className="w-4 h-4" /> Entfernen</button>
        </>
      ) : (
        <span className="text-sm text-[#4B767A]">Kein Audio – Wiedergabe ist deaktiviert</span>
      )}
      <input ref={input} type="file" accept="audio/mpeg,.mp3" className="hidden" onChange={upload} data-testid={`${testId}-input`} />
      <button type="button" disabled={busy} onClick={() => input.current?.click()} className="rounded-full border-2 border-[#169CA3]/40 px-3 py-1.5 text-sm font-bold flex items-center gap-1 bg-white" data-testid={`${testId}-upload-btn`}>
        <Upload className="w-4 h-4" /> {busy ? "Lädt …" : value ? "MP3 ersetzen" : "MP3 hochladen"}
      </button>
    </div>
  );
}

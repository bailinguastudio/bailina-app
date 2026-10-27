import { useEffect, useRef, useState } from "react";
import { Volume2, Pause, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { mediaUrl } from "@/lib/api";

export function AudioButton({ src, label = "Anhören", onPlay, testId = "audio-play-btn", className = "btn-turq" }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return () => {
      ref.current?.pause();
      ref.current = null;
      setPlaying(false);
    };
  }, [src]);

  if (!src) {
    return (
      <button type="button" disabled className="btn btn-ghost text-base" data-testid={testId} aria-label="Audio noch nicht verfügbar">
        <VolumeX className="w-6 h-6" /> Audio folgt
      </button>
    );
  }

  const toggle = () => {
    if (!ref.current) {
      ref.current = new Audio(mediaUrl(src));
      ref.current.onended = () => setPlaying(false);
    }
    if (playing) {
      ref.current.pause();
      setPlaying(false);
      return;
    }
    ref.current
      .play()
      .then(() => {
        setPlaying(true);
        onPlay?.();
      })
      .catch(() => toast.error("Audio konnte nicht abgespielt werden"));
  };

  return (
    <button type="button" onClick={toggle} className={`btn ${className}`} data-testid={testId}>
      {playing ? <Pause className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
      {playing ? "Pause" : label}
    </button>
  );
}

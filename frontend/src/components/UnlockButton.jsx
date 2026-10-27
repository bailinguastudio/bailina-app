import { KeyRound } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function UnlockButton({ className = "btn-sun" }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className={`btn ${className} text-base`} data-testid="unlock-access-btn">
          <KeyRound className="w-5 h-5" /> Zugang freischalten
        </button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl max-w-md" data-testid="unlock-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Bald verfügbar</DialogTitle>
          <DialogDescription className="text-base text-[#174B50]">
            Platzhalter: Das Freischalten weiterer Welten ist noch nicht verbunden. Es findet keine Zahlung statt.
            Die Demo-Welt „¡Hola!“ ist komplett kostenlos spielbar.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

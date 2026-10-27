import { Link } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";
import { Art } from "@/components/Art";
import { useContent } from "@/context/ContentContext";

export function TopBar({ back, backLabel = "Zurück", title }) {
  const { data } = useContent();
  return (
    <header className="no-print sticky top-0 z-40 bg-[#FFF8EA]/85 backdrop-blur-md border-b-4 border-[#169CA3]/15">
      {data?.preview && (
        <div className="bg-[#FF9800] text-white text-center text-xs sm:text-sm font-bold py-1 px-3" data-testid="admin-preview-banner">
          Admin-Vorschau: Bilder „Zur Freigabe“ und unveröffentlichte Welten sind nur für Sie sichtbar.
        </div>
      )}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-[72px] flex items-center gap-3">
        {back ? (
          <Link to={back} className="btn btn-ghost !min-h-[52px] !px-4 text-base" data-testid="topbar-back-btn" aria-label={backLabel}>
            <ArrowLeft className="w-6 h-6" /> <span className="hidden sm:inline">{backLabel}</span>
          </Link>
        ) : (
          <Link to="/" className="flex items-center gap-2" data-testid="topbar-home-link">
            <Art imageKey="capi" icon="Smile" label="Capi" className="w-11 h-11 rounded-full border-2 border-white shadow" />
            <span className="font-display font-bold text-lg sm:text-xl text-[#174B50] leading-none">Bailina <span className="text-[#F36F5B]">Sing & Play</span></span>
          </Link>
        )}
        {title && <h1 className="font-display font-bold text-lg sm:text-2xl truncate flex-1 text-center">{title}</h1>}
        {!title && <div className="flex-1" />}
        <Link to="/eltern" className="btn btn-ghost !min-h-[52px] !px-4 text-base" data-testid="topbar-parent-link">
          <Lock className="w-5 h-5" /> <span className="hidden sm:inline">Eltern</span>
        </Link>
      </div>
    </header>
  );
}

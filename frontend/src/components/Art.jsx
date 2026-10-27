import {
  Hand, Footprints, Sun, Moon, CircleHelp, Smile, Gift, Apple, ThumbsUp, Users,
  Sparkles, Music, Star, Heart, Puzzle, ListOrdered, Image as ImageIcon, Printer,
} from "lucide-react";
import { useContent } from "@/context/ContentContext";
import { mediaUrl } from "@/lib/api";

export const ICONS = { Hand, Footprints, Sun, Moon, CircleHelp, Smile, Gift, Apple, ThumbsUp, Users, Sparkles, Music, Star, Heart, Puzzle, ListOrdered, ImageIcon, Printer };
export const ICON_NAMES = Object.keys(ICONS);

const TINTS = ["#D4F2EE", "#FEF3D6", "#FDE8E3"];

export function Art({ imageKey, icon = "Sparkles", label = "", className = "", fit = "object-cover", testId }) {
  const { data } = useContent();
  const img = data?.images?.[imageKey];
  const Icon = ICONS[icon] || Sparkles;
  const tint = TINTS[(label.length || 0) % TINTS.length];

  if (img?.url) {
    return (
      <div className={`relative overflow-hidden ${className}`} data-testid={testId}>
        <img src={mediaUrl(img.url)} alt={label} className={`w-full h-full ${fit}`} draggable={false} />
        {img.status !== "approved" && (
          <span className="absolute top-2 left-2 rounded-full bg-[#FF9800] text-white text-[10px] sm:text-xs font-bold px-2 py-1 uppercase tracking-wide shadow" data-testid="art-pending-badge">
            Zur Freigabe
          </span>
        )}
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden flex items-center justify-center ${className}`} style={{ background: tint }} data-testid={testId} aria-label={label}>
      <Icon className="w-1/2 h-1/2 text-[#169CA3]" strokeWidth={1.6} />
    </div>
  );
}

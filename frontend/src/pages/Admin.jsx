import { useCallback, useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { LogOut, Plus, Eye } from "lucide-react";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useContent } from "@/context/ContentContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorldEditor } from "@/components/admin/WorldEditor";
import { ImagesPanel } from "@/components/admin/ImagesPanel";

export default function Admin() {
  const { user, logout } = useAuth();
  const { reload } = useContent();
  const [worlds, setWorlds] = useState([]);
  const [images, setImages] = useState([]);
  const [active, setActive] = useState("");

  const load = useCallback(async () => {
    try {
      const [w, i] = await Promise.all([api.get("/admin/worlds"), api.get("/admin/images")]);
      setWorlds(w.data);
      setImages(i.data);
      setActive((a) => a || w.data[0]?.slug || "");
    } catch (e) {
      toast.error(formatApiError(e));
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (user === null) return <p className="p-8 font-display text-xl">Einen Moment …</p>;
  if (user === false) return <Navigate to="/admin/login" replace />;

  const newWorld = async () => {
    const slug = window.prompt("Kurzname der neuen Welt (z. B. tiere):");
    if (!slug) return;
    const title = window.prompt("Titel der Welt (z. B. ¡Animales! – Tiere):") || slug;
    try {
      const { data } = await api.post("/admin/worlds", { slug, title });
      setWorlds((ws) => [...ws, data]);
      setActive(data.slug);
      toast.success("Welt angelegt (noch nicht veröffentlicht)");
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const onSaved = (w) => {
    setWorlds((ws) => ws.map((x) => (x.slug === w.slug ? w : x)));
    reload();
  };
  const world = worlds.find((w) => w.slug === active);

  return (
    <div className="min-h-screen bg-[#F4FAF9]" data-testid="admin-page">
      <header className="sticky top-0 z-40 bg-white border-b-2 border-[#169CA3]/15">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-3">
          <h1 className="font-display font-bold text-xl flex-1">Inhalts-Editor <span className="text-sm font-medium text-[#4B767A] hidden sm:inline">· {user.email}</span></h1>
          <Link to="/" className="btn btn-ghost !min-h-[44px] text-sm" data-testid="admin-preview-link"><Eye className="w-4 h-4" /> Vorschau</Link>
          <button className="btn btn-ghost !min-h-[44px] text-sm" onClick={logout} data-testid="admin-logout-btn"><LogOut className="w-4 h-4" /> Abmelden</button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="content">
          <TabsList className="mb-6">
            <TabsTrigger value="content" data-testid="admin-tab-content">Inhalte</TabsTrigger>
            <TabsTrigger value="images" data-testid="admin-tab-images">Bilder-Freigabe ({images.filter((i) => i.status === "pending").length} offen)</TabsTrigger>
          </TabsList>
          <TabsContent value="content">
            <div className="flex flex-wrap gap-2 mb-6">
              {worlds.map((w) => (
                <button key={w.slug} onClick={() => setActive(w.slug)} className={`rounded-full px-4 py-2 font-bold border-2 ${active === w.slug ? "bg-[#169CA3] text-white border-[#169CA3]" : "bg-white border-[#169CA3]/30"}`} data-testid={`admin-world-select-${w.slug}`}>
                  {w.title} {!w.published && "· Entwurf"}
                </button>
              ))}
              <button onClick={newWorld} className="rounded-full px-4 py-2 font-bold border-2 border-dashed border-[#169CA3]/50 flex items-center gap-1" data-testid="admin-new-world-btn"><Plus className="w-4 h-4" /> Neue Welt</button>
            </div>
            {world && <WorldEditor key={world.slug + world.updated_at} world={world} images={images} onSaved={onSaved} />}
          </TabsContent>
          <TabsContent value="images">
            <ImagesPanel images={images} setImages={setImages} onChanged={reload} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

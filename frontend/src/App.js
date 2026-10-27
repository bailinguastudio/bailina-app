import "@/App.css";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { ContentProvider } from "@/context/ContentContext";
import { AuthProvider } from "@/context/AuthContext";
import Home from "@/pages/Home";
import Worlds from "@/pages/Worlds";
import WorldHub from "@/pages/WorldHub";
import GamePicture from "@/pages/GamePicture";
import GamePairs from "@/pages/GamePairs";
import GameOrder from "@/pages/GameOrder";
import SongPage from "@/pages/SongPage";
import PrintPage from "@/pages/PrintPage";
import Parent from "@/pages/Parent";
import AdminLogin from "@/pages/AdminLogin";
import Admin from "@/pages/Admin";

const AdminShell = () => (
  <AuthProvider>
    <Outlet />
  </AuthProvider>
);

function App() {
  return (
    <div className="App">
      <ContentProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/welten" element={<Worlds />} />
            <Route path="/welt/:slug" element={<WorldHub />} />
            <Route path="/welt/:slug/bild" element={<GamePicture />} />
            <Route path="/welt/:slug/paare" element={<GamePairs />} />
            <Route path="/welt/:slug/reihenfolge" element={<GameOrder />} />
            <Route path="/welt/:slug/lied" element={<SongPage />} />
            <Route path="/welt/:slug/drucken" element={<PrintPage />} />
            <Route path="/eltern" element={<Parent />} />
            <Route element={<AdminShell />}>
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<Admin />} />
            </Route>
            <Route path="*" element={<Home />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" richColors />
      </ContentProvider>
    </div>
  );
}

export default App;

import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useContent } from "@/context/ContentContext";

export default function AdminLogin() {
  const { user, setUser } = useAuth();
  const { reload } = useContent();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setUser(data);
      reload();
      navigate("/admin");
    } catch (err) {
      setError(formatApiError(err));
    }
    setBusy(false);
  };

  const field = "w-full rounded-2xl border-2 border-[#169CA3]/30 focus:border-[#169CA3] outline-none px-4 py-3 bg-white text-base";
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#EAF6F5]">
      <form onSubmit={submit} className="card-soft w-full max-w-sm p-7 space-y-4" data-testid="admin-login-form">
        <ShieldCheck className="w-10 h-10 text-[#169CA3]" />
        <h1 className="font-display font-bold text-2xl">Betreiber-Login</h1>
        <p className="text-sm text-[#4B767A]">Nur für das Bailina-Team. Familien benötigen keinen Zugang.</p>
        <input className={field} type="email" placeholder="E-Mail" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required data-testid="admin-login-email" />
        <input className={field} type="password" placeholder="Passwort" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required data-testid="admin-login-password" />
        {error && <p className="text-[#C9503E] text-sm" data-testid="admin-login-error">{error}</p>}
        <button className="btn btn-turq w-full" disabled={busy} data-testid="admin-login-submit">{busy ? "Anmelden …" : "Anmelden"}</button>
      </form>
    </div>
  );
}

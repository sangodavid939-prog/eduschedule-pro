import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const REDIRECTION = {
  administrateur: "/dashboard/admin",
  enseignant:     "/dashboard/enseignant",
  delegue:        "/dashboard/delegue",
  surveillant:    "/dashboard/surveillant",
  comptable:      "/dashboard/comptable",
  etudiant: "/dashboard/etudiant",
};

const COMPTES = [
  { label: "Admin",       email: "admin@eduschedule.bf",        couleur: "#0d6efd" },
  { label: "Enseignant",  email: "c.bere@isge.bf",              couleur: "#22c55e" },
  { label: "Delegue",     email: "delegue.l1@eduschedule.bf",   couleur: "#06b6d4" },
  { label: "Surveillant", email: "surveillant@eduschedule.bf",  couleur: "#f59e0b" },
  { label: "Comptable",   email: "comptable@eduschedule.bf",    couleur: "#ef4444" },
  { label: "Etudiant", email: "etudiant@eduschedule.bf", couleur: "#8b5cf6" },
];

export default function LoginPage() {
  const { connexion } = useAuth();
  const navigate      = useNavigate();
  const [email, setEmail]      = useState("");
  const [mdp, setMdp]          = useState("");
  const [chargement, setCharg] = useState(false);
  const [erreur, setErreur]    = useState("");
  const [showMdp, setShowMdp]  = useState(false);
  const [heure, setHeure]      = useState(new Date().toLocaleTimeString('fr-FR'));

  useEffect(() => {
    const timer = setInterval(() => {
      setHeure(new Date().toLocaleTimeString('fr-FR'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setCharg(true);
    const res = await connexion(email, mdp);
    setCharg(false);
    if (!res.succes) { setErreur(res.erreur); return; }
    const user = JSON.parse(localStorage.getItem("edu_user") || "{}");
    navigate(REDIRECTION[user.role] || "/dashboard/admin", { replace: true });
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0d6efd 100%)",
    }}>
      {/* Panneau gauche */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px", color: "white", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 400 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, background: "#0d6efd", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, boxShadow: "0 8px 24px rgba(13,110,253,0.4)" }}>
              📅
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: -0.5 }}>EduSchedule Pro</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>ISGE — Burkina Faso</div>
            </div>
          </div>

          {/* Horloge */}
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 20px", marginBottom: 32, display: "inline-block" }}>
            <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: 2, fontFamily: "monospace" }}>{heure}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          <h1 style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
            Gestion Pedagogique
            <span style={{ color: "#0d6efd", display: "block" }}>Intelligente</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
            Planifiez les cours, suivez les presences, gerez les vacations et assurez le suivi pedagogique en temps reel.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { icone: "📅", texte: "Emploi du temps interactif" },
              { icone: "📱", texte: "Pointage QR Code securise" },
              { icone: "📋", texte: "Cahiers de texte numeriques" },
              { icone: "💰", texte: "Calcul automatique des vacations" },
            ].map((f) => (
              <div key={f.texte} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, background: "rgba(255,255,255,0.1)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                  {f.icone}
                </div>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>{f.texte}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panneau droit */}
      <div style={{ width: 480, display: "flex", alignItems: "center", justifyContent: "center", padding: 40, position: "relative", zIndex: 2 }}>
        <div style={{ background: "white", borderRadius: 24, padding: 40, width: "100%", boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}>
          <h2 style={{ fontWeight: 800, fontSize: 24, color: "#0f172a", marginBottom: 4 }}>Connexion</h2>
          <p style={{ color: "#64748b", fontSize: 14, marginBottom: 28 }}>Connectez-vous a votre espace</p>

          {erreur && (
            <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 14px", marginBottom: 20, color: "#dc2626", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
              ⚠️ {erreur}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#374151" }}>Adresse email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@isge.bf" required autoFocus
                style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1.5px solid #e2e8f0", fontSize: 14, boxSizing: "border-box", outline: "none" }}
                onFocus={(e) => e.target.style.border = "1.5px solid #0d6efd"}
                onBlur={(e) => e.target.style.border = "1.5px solid #e2e8f0"}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#374151" }}>Mot de passe</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showMdp ? "text" : "password"} value={mdp} onChange={(e) => setMdp(e.target.value)}
                  placeholder="••••••••" required
                  style={{ width: "100%", padding: "12px 48px 12px 16px", borderRadius: 12, border: "1.5px solid #e2e8f0", fontSize: 14, boxSizing: "border-box", outline: "none" }}
                  onFocus={(e) => e.target.style.border = "1.5px solid #0d6efd"}
                  onBlur={(e) => e.target.style.border = "1.5px solid #e2e8f0"}
                />
                <button type="button" onClick={() => setShowMdp(!showMdp)}
                  style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#64748b" }}>
                  {showMdp ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button type="submit" disabled={chargement || !email || !mdp}
              style={{ width: "100%", padding: "13px", borderRadius: 12, background: chargement || !email || !mdp ? "#94a3b8" : "#0d6efd", color: "white", border: "none", cursor: chargement ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 15, boxShadow: "0 4px 16px rgba(13,110,253,0.3)" }}>
              {chargement ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>

          <div style={{ margin: "24px 0", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>Comptes demo</span>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {COMPTES.map((c) => (
              <button key={c.email} onClick={() => { setEmail(c.email); setMdp("Admin1234!"); }}
                style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: c.couleur + "15", color: c.couleur, border: `1px solid ${c.couleur}40`, cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = c.couleur; e.currentTarget.style.color = "white"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = c.couleur + "15"; e.currentTarget.style.color = c.couleur; }}>
                {c.label}
              </button>
            ))}
          </div>

          <p style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", marginTop: 24 }}>
            ITRST — Annee universitaire 2025-2026
          </p>
        </div>
      </div>
    </div>
  );
}
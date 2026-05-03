import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV = {
  administrateur: [
    { label: "Tableau de bord",  path: "/dashboard/admin",      icone: "📊" },
    { label: "Emploi du temps",  path: "/emploi-temps",         icone: "📅" },
    { label: "Cahiers de texte", path: "/cahiers",              icone: "📋" },
    { label: "Vacations",        path: "/vacations",            icone: "💰" },
    { label: "Rapports",         path: "/rapports",             icone: "📈" },
    { label: "Classes",          path: "/admin/classes",        icone: "🎓" },
    { label: "Enseignants",      path: "/admin/enseignants",    icone: "👤" },
    { label: "Étudiants",        path: "/admin/etudiants",      icone: "🎒" }, 
    { label: "Matieres",         path: "/admin/matieres",       icone: "📖" },
    { label: "Salles",           path: "/admin/salles",         icone: "🏛" },
    { label: "Utilisateurs",       path: "/admin/utilisateurs", icone: "👥" }
  ],
  enseignant: [
    { label: "Tableau de bord",  path: "/dashboard/enseignant", icone: "📊" },
    { label: "Emploi du temps",  path: "/emploi-temps",         icone: "📅" },
    { label: "Pointer seance",   path: "/pointage",             icone: "📱" },
    { label: "Mes cahiers",      path: "/cahiers",              icone: "📋" },
    { label: "Mes vacations",    path: "/vacations",            icone: "💰" },
  ],
  delegue: [
    { label: "Tableau de bord",  path: "/dashboard/delegue",   icone: "📊" },
    { label: "Emploi du temps",  path: "/emploi-temps",        icone: "📅" },
    { label: "Cahiers de texte", path: "/cahiers",             icone: "📋" },
  ],
  surveillant: [
    { label: "Tableau de bord",  path: "/dashboard/surveillant", icone: "📊" },
    { label: "Pointage Manuel",  path: "/pointage-manuel",       icone: "✍️" },
    { label: "Cahiers de texte", path: "/cahiers",               icone: "📋" },
    { label: "Vacations",        path: "/vacations",             icone: "💰" },
    { label: "Rapports",         path: "/rapports",              icone: "📈" },
  ],
  comptable: [
    { label: "Tableau de bord",  path: "/dashboard/comptable",  icone: "📊" },
    { label: "Vacations",        path: "/vacations",            icone: "💰" },
  ],
  etudiant: [
    { label: "Mon emploi du temps", path: "/dashboard/etudiant", icone: "📅" },
  ],
};

const COULEURS = {
  administrateur: "#0d6efd",
  enseignant:     "#22c55e",
  delegue:        "#06b6d4",
  surveillant:    "#f59e0b",
  comptable:      "#ef4444",
  etudiant:       "#8b5cf6",
};

export default function DashboardLayout() {
  const { utilisateur, deconnexion } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const navItems  = NAV[utilisateur?.role] || [];
  const couleur   = COULEURS[utilisateur?.role] || "#0d6efd";

  const handleDeconnexion = () => {
    deconnexion();
    navigate("/login");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>

      {/* Sidebar */}
      <aside style={{
        width: 240,
        background: "#0f172a",
        color: "white",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
      }}>

        {/* Logo */}
        <div style={{ padding: "20px 16px", borderBottom: "1px solid #1e293b" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, background: couleur, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
              📅
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>EduSchedule Pro</div>
              <div style={{ fontSize: 10, color: "#64748b" }}>ISGE — 2025-2026</div>
            </div>
          </div>

          {/* Infos utilisateur */}
          <div style={{ background: "#1e293b", borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 32, height: 32, background: couleur, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>
                {utilisateur?.nom?.charAt(0) || "U"}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {utilisateur?.nom}
                </div>
                <div style={{ fontSize: 10, color: couleur, textTransform: "capitalize" }}>
                  {utilisateur?.role}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "12px 8px" }}>
          <div style={{ fontSize: 10, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, padding: "4px 8px", marginBottom: 4 }}>
            Navigation
          </div>
          {navItems.map((item) => {
            const actif = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  marginBottom: 2,
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: actif ? 600 : 400,
                  background: actif ? couleur : "transparent",
                  color: actif ? "white" : "#94a3b8",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { if (!actif) e.currentTarget.style.background = "#1e293b"; e.currentTarget.style.color = "white"; }}
                onMouseLeave={(e) => { if (!actif) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; } }}
              >
                <span style={{ fontSize: 16 }}>{item.icone}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Deconnexion */}
        <div style={{ padding: "12px 8px", borderTop: "1px solid #1e293b" }}>
          <button
            onClick={handleDeconnexion}
            style={{
              width: "100%", padding: "10px 12px",
              background: "transparent", color: "#ef4444",
              border: "1px solid #ef444430", borderRadius: 8,
              cursor: "pointer", fontSize: 13, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 8,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#ef444420"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            🚪 Deconnexion
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <main style={{ flex: 1, padding: 24, background: "#f8fafc" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
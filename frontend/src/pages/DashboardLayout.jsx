import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useRef } from "react";

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
    { label: "Utilisateurs",     path: "/admin/utilisateurs",   icone: "👥" }
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
  const { utilisateur, deconnexion, headersAuth } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const navItems  = NAV[utilisateur?.role] || [];
  const couleur   = COULEURS[utilisateur?.role] || "#0d6efd";

  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs]       = useState(false);
  const [nonLues, setNonLues]             = useState(0);
  const notifRef                          = useRef(null);

  useEffect(() => {
    const chargerNotifications = async () => {
      try {
        const res = await fetch("/api/notifications.php?action=liste", { headers: headersAuth() });
        if (!res.ok) return;
        const data = await res.json();
        if (data.succes) {
          setNotifications(data.data || []);
          setNonLues((data.data || []).filter(n => !n.lue).length);
        }
      } catch (e) {}
    };
    chargerNotifications();
    const interval = setInterval(chargerNotifications, 30000);
    return () => clearInterval(interval);
  }, [headersAuth]);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const marquerLue = async (id) => {
    try {
      await fetch("/api/notifications.php?action=marquer_lue", {
        method: "POST", headers: headersAuth(), body: JSON.stringify({ id }),
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, lue: 1 } : n));
      setNonLues(prev => Math.max(0, prev - 1));
    } catch (e) {}
  };

  const marquerToutesLues = async () => {
    try {
      await fetch("/api/notifications.php?action=marquer_toutes_lues", {
        method: "POST", headers: headersAuth(),
      });
      setNotifications(prev => prev.map(n => ({ ...n, lue: 1 })));
      setNonLues(0);
    } catch (e) {}
  };

  const getIconeNotif = (type) => {
    const icones = {
      vacation_signee:    "✍️",
      vacation_visee:     "🔏",
      vacation_approuvee: "✅",
      vacation_payee:     "💰",
      seance_non_pointee: "⚠️",
      pointage:           "📱",
      cahier_signe:       "📋",
    };
    return icones[type] || "🔔";
  };

  const handleDeconnexion = () => {
    deconnexion();
    navigate("/login");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      <aside style={{
        width: 240, background: "#0f172a", color: "white",
        display: "flex", flexDirection: "column",
        position: "sticky", top: 0, height: "100vh", overflowY: "auto",
      }}>
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
          <div style={{ background: "#1e293b", borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 32, height: 32, background: couleur, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>
                {utilisateur?.nom?.charAt(0) || "U"}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {utilisateur?.nom}
                </div>
                <div style={{ fontSize: 10, color: couleur, textTransform: "capitalize" }}>
                  {utilisateur?.role}
                </div>
              </div>
              {/* Cloche notifications */}
              <div ref={notifRef} style={{ position: "relative" }}>
                <button onClick={() => setShowNotifs(!showNotifs)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, position: "relative", padding: 4 }}>
                  🔔
                  {nonLues > 0 && (
                    <span style={{
                      position: "absolute", top: 0, right: 0,
                      background: "#ef4444", color: "white", borderRadius: "50%",
                      width: 16, height: 16, fontSize: 9, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {nonLues > 9 ? "9+" : nonLues}
                    </span>
                  )}
                </button>
                {showNotifs && (
                  <div style={{
                    position: "fixed", top: 80, left: 200, zIndex: 9999,
                    background: "white", borderRadius: 12, width: 340,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                    border: "1px solid #e2e8f0", overflow: "hidden",
                  }}>
                    <div style={{ background: "#0f172a", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ color: "white", fontWeight: 700, fontSize: 14 }}>
                        🔔 Notifications
                        {nonLues > 0 && <span style={{ background: "#ef4444", color: "white", borderRadius: 10, padding: "1px 7px", fontSize: 11, marginLeft: 6 }}>{nonLues}</span>}
                      </div>
                      {nonLues > 0 && (
                        <button onClick={marquerToutesLues}
                          style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 11 }}>
                          Tout marquer lu
                        </button>
                      )}
                    </div>
                    <div style={{ maxHeight: 360, overflowY: "auto" }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>
                          <div style={{ fontSize: 32, marginBottom: 8 }}>🔕</div>
                          <div style={{ fontSize: 13 }}>Aucune notification</div>
                        </div>
                      ) : notifications.map((n) => (
                        <div key={n.id} onClick={() => marquerLue(n.id)}
                          style={{
                            padding: "12px 16px", borderBottom: "1px solid #f1f5f9",
                            background: n.lue ? "white" : "#eff6ff",
                            cursor: "pointer", display: "flex", gap: 12, alignItems: "flex-start",
                          }}>
                          <div style={{ fontSize: 20, flexShrink: 0 }}>{getIconeNotif(n.type)}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, color: "#0f172a", fontWeight: n.lue ? 400 : 600, marginBottom: 2 }}>
                              {n.message}
                            </div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>{n.date_creation}</div>
                          </div>
                          {!n.lue && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0d6efd", flexShrink: 0, marginTop: 4 }} />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "12px 8px" }}>
          <div style={{ fontSize: 10, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, padding: "4px 8px", marginBottom: 4 }}>
            Navigation
          </div>
          {navItems.map((item) => {
            const actif = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", marginBottom: 2, borderRadius: 8,
                  textDecoration: "none", fontSize: 13,
                  fontWeight: actif ? 600 : 400,
                  background: actif ? couleur : "transparent",
                  color: actif ? "white" : "#94a3b8",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { if (!actif) { e.currentTarget.style.background = "#1e293b"; e.currentTarget.style.color = "white"; } }}
                onMouseLeave={(e) => { if (!actif) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; } }}
              >
                <span style={{ fontSize: 16 }}>{item.icone}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "12px 8px", borderTop: "1px solid #1e293b" }}>
          <button onClick={handleDeconnexion}
            style={{
              width: "100%", padding: "10px 12px",
              background: "transparent", color: "#ef4444",
              border: "1px solid #ef444430", borderRadius: 8,
              cursor: "pointer", fontSize: 13, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 8,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#ef444420"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            🚪 Deconnexion
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <main style={{ flex: 1, padding: 24, background: "#f8fafc" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
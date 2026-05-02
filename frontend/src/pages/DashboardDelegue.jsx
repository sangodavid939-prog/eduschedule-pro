import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function DashboardDelegue() {
  const { headersAuth, utilisateur } = useAuth();
  const navigate = useNavigate();
  const [cahiers, setCahiers]         = useState([]);
  const [planning, setPlanning]       = useState({});
  const [classes, setClasses]         = useState([]);
  const [idClasse, setIdClasse]       = useState("");
  const [chargement, setChargement]   = useState(true);

  const JOURS = ["lundi","mardi","mercredi","jeudi","vendredi","samedi"];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const h = headersAuth();
    fetch("/api/cahiers.php?action=liste", { headers: h })
      .then((r) => r.json())
      .then((d) => { setCahiers(d.data || []); setChargement(false); })
      .catch(() => setChargement(false));
    // Charger les classes
    fetch("/api/emploi_temps.php", { headers: h })
      .then((r) => r.json())
      .then((d) => {
        const data = d.data || [];
        setClasses(data);
        if (data.length > 0) setIdClasse(data[0].id);
      });
  }, []);

  // Charger le planning quand la classe change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!idClasse) return;

    // ✅ Aujourd'hui dimanche → prendre le lundi PROCHAIN
    const aujourd_hui = new Date();
    const jour = aujourd_hui.getDay(); // 0=dim, 1=lun...
    
    // Si dimanche (0) → lundi suivant (+1), sinon lundi de cette semaine
    const diff = jour === 0 ? 1 : 1 - jour;
    const lundi = new Date(aujourd_hui);
    lundi.setDate(aujourd_hui.getDate() + diff);
    const semaine = lundi.toISOString().slice(0, 10);

    fetch(`/api/emploi_temps.php?id_classe=${idClasse}&semaine=${semaine}`, { headers: headersAuth() })
      .then((r) => r.json())
      .then((d) => setPlanning(d.data || {}));
}, [idClasse]);

  const cahiersACompleter = cahiers.filter((c) => c.statut === "brouillon" || c.statut === "en_cours");
  const cahiersClotures   = cahiers.filter((c) => c.statut === "cloture");

  const statutBadge = (statut) => {
    if (statut === "cloture")       return { bg: "#dcfce7", color: "#15803d", label: "✅ Cloture" };
    if (statut === "signe_delegue") return { bg: "#dbeafe", color: "#1d4ed8", label: "✍️ Signe" };
    if (statut === "en_cours")      return { bg: "#fef9c3", color: "#a16207", label: "⏳ A signer" };
    return { bg: "#f1f5f9", color: "#475569", label: "📝 A remplir" };
  };

  if (chargement) return <div className="text-center py-5"><div className="spinner-border text-info" /></div>;

  return (
    <div>
      <h2 style={{ fontWeight: 700, fontSize: 24, color: "#0f172a", marginBottom: 4 }}>Bonjour, {utilisateur?.nom} 👋</h2>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>Espace delegue de classe</p>

      {/* Alerte cahiers à compléter */}
      {cahiersACompleter.length > 0 && (
        <div style={{ background: "#fef9c3", border: "2px solid #fbbf24", borderRadius: 10, padding: 16, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: "#a16207", marginBottom: 6 }}>
            📓 {cahiersACompleter.length} cahier(s) en attente de votre action !
          </div>
          <button onClick={() => navigate("/cahiers")}
            style={{ padding: "8px 16px", background: "#f59e0b", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
            📝 Aller aux cahiers →
          </button>
        </div>
      )}

      {/* Cartes statistiques */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "#eff6ff", borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 28, color: "#0d6efd" }}>{cahiers.length}</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Total cahiers</div>
        </div>
        <div style={{ background: "#fef9c3", borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 28, color: "#a16207" }}>{cahiersACompleter.length}</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>A completer</div>
        </div>
        <div style={{ background: "#f0fdf4", borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 28, color: "#22c55e" }}>{cahiersClotures.length}</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Clotures</div>
        </div>
      </div>

      {/* ✅ Emploi du temps de ma classe */}
      <div style={{ background: "white", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h6 style={{ fontWeight: 700, color: "#0f172a", margin: 0 }}>📅 Emploi du temps — Semaine en cours</h6>
          <select value={idClasse} onChange={(e) => setIdClasse(e.target.value)}
            style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.libelle}</option>)}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
          {JOURS.map((jour) => (
            <div key={jour}>
              <div style={{ textAlign: "center", fontWeight: 700, fontSize: 11, color: "#475569", textTransform: "capitalize", marginBottom: 6, background: "#f8fafc", padding: "4px", borderRadius: 6 }}>
                {jour}
              </div>
              {(planning[jour] || []).length === 0 ? (
                <div style={{ textAlign: "center", fontSize: 11, color: "#cbd5e1", padding: "8px 0" }}>Libre</div>
              ) : (
                (planning[jour] || []).map((c, i) => (
                  <div key={i} style={{ background: "#eff6ff", borderLeft: "3px solid #0d6efd", borderRadius: 6, padding: "6px 8px", marginBottom: 4, fontSize: 11 }}>
                    <div style={{ fontWeight: 700, color: "#0d6efd", marginBottom: 2 }}>{c.matiere}</div>
                    <div style={{ color: "#64748b" }}>{c.heure_debut?.slice(0,5)} - {c.heure_fin?.slice(0,5)}</div>
                    <div style={{ color: "#94a3b8", fontSize: 10 }}>{c.enseignant}</div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Historique des cahiers signés */}
      <div style={{ background: "white", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h6 style={{ fontWeight: 700, color: "#0f172a", margin: 0 }}>📋 Historique des cahiers</h6>
          <button onClick={() => navigate("/cahiers")}
            style={{ padding: "6px 14px", background: "#0d6efd", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            Voir tout →
          </button>
        </div>
        {cahiers.length === 0 ? (
          <div style={{ color: "#94a3b8", fontSize: 13 }}>Aucun cahier trouve.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Date","Matiere","Enseignant","Titre","Statut"].map((h) => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", borderBottom: "1px solid #e2e8f0", fontWeight: 600, color: "#374151" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cahiers.slice(0, 8).map((c) => {
                const badge = statutBadge(c.statut);
                return (
                  <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9", background: (c.statut === "brouillon" || c.statut === "en_cours") ? "#fffbeb" : "transparent" }}>
                    <td style={{ padding: "8px 12px" }}>{c.semaine_debut}</td>
                    <td style={{ padding: "8px 12px", fontWeight: 600 }}>{c.matiere}</td>
                    <td style={{ padding: "8px 12px", color: "#64748b" }}>{c.enseignant}</td>
                    <td style={{ padding: "8px 12px", color: "#64748b" }}>{c.titre_cours || <span style={{ color: "#cbd5e1" }}>Non renseigne</span>}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ background: badge.bg, color: badge.color, padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const MOIS = ["Janvier","Fevrier","Mars","Avril","Mai","Juin","Juillet","Aout","Septembre","Octobre","Novembre","Decembre"];

export default function DashboardEnseignant() {
  const { headersAuth, utilisateur } = useAuth();
  const navigate = useNavigate();
  const [seances, setSeances]       = useState([]);
  const [vacations, setVacations]   = useState([]);
  const [moisActif, setMoisActif]   = useState(new Date().getMonth());
  const [chargement, setChargement] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const h = headersAuth();
    fetch("/api/cahiers.php?action=liste", { headers: h })
      .then((r) => r.json())
      .then((d) => { setSeances(d.data || []); setChargement(false); })
      .catch(() => setChargement(false));
    fetch("/api/vacations.php?action=liste", { headers: h })
      .then((r) => r.json())
      .then((d) => setVacations(d.data || []));
  }, []);

  const fichesASigner = vacations.filter((v) => v.statut === "generee");

  // ✅ Historique par mois
  const seancesDuMois = seances.filter((s) => {
    if (!s.semaine_debut) return false;
    const mois = new Date(s.semaine_debut).getMonth();
    return mois === moisActif;
  });

  const statutBadge = (statut) => {
    if (statut === "cloture")       return { bg: "#dcfce7", color: "#15803d", label: "Cloturee" };
    if (statut === "signe_delegue") return { bg: "#dbeafe", color: "#1d4ed8", label: "Signe delegue" };
    if (statut === "en_cours")      return { bg: "#fef9c3", color: "#a16207", label: "En cours" };
    return { bg: "#f1f5f9", color: "#475569", label: statut };
  };

  if (chargement) return <div className="text-center py-5"><div className="spinner-border text-success" /></div>;

  return (
    <div>
      <h2 style={{ fontWeight: 700, fontSize: 24, color: "#0f172a", marginBottom: 4 }}>Bonjour, {utilisateur?.nom} 👋</h2>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>Voici un resume de vos seances et vacations</p>

      {/* Alerte fiches à signer */}
      {fichesASigner.length > 0 && (
        <div style={{ background: "#fef9c3", border: "2px solid #fbbf24", borderRadius: 10, padding: 16, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: "#a16207", marginBottom: 6 }}>
            ✍️ Vous avez {fichesASigner.length} fiche(s) de vacation a signer !
          </div>
          <button onClick={() => navigate("/vacations")}
            style={{ padding: "8px 16px", background: "#f59e0b", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
            ✍️ Signer mes fiches →
          </button>
        </div>
      )}

      {/* Cartes statistiques */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "#eff6ff", borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 28, color: "#0d6efd" }}>{seances.length}</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Total séances</div>
        </div>
        <div style={{ background: "#fffbeb", borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 28, color: "#f59e0b" }}>{seances.filter((s) => s.statut !== "cloture").length}</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>En attente</div>
        </div>
        <div style={{ background: "#f0fdf4", borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 28, color: "#22c55e" }}>{seances.filter((s) => s.statut === "cloture").length}</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Cloturees</div>
        </div>
      </div>

      {/* ✅ Historique complet par mois */}
      <div style={{ background: "white", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h6 style={{ fontWeight: 700, color: "#0f172a", margin: 0 }}>📅 Historique des seances par mois</h6>
          <select value={moisActif} onChange={(e) => setMoisActif(parseInt(e.target.value))}
            style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}>
            {MOIS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>
        {seancesDuMois.length === 0 ? (
          <div style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
            Aucune seance en {MOIS[moisActif]}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Date","Matiere","Classe","Horaire","Statut"].map((h) => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", borderBottom: "1px solid #e2e8f0", fontWeight: 600, color: "#374151" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {seancesDuMois.map((s) => {
                const badge = statutBadge(s.statut);
                return (
                  <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "8px 12px" }}>{s.semaine_debut}</td>
                    <td style={{ padding: "8px 12px", fontWeight: 600 }}>{s.matiere}</td>
                    <td style={{ padding: "8px 12px", color: "#64748b" }}>{s.classe}</td>
                    <td style={{ padding: "8px 12px", color: "#64748b" }}>{s.heure_debut?.slice(0,5)} - {s.heure_fin?.slice(0,5)}</td>
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

      {/* Mes vacations */}
      <div style={{ background: "white", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h6 style={{ fontWeight: 700, color: "#0f172a", margin: 0 }}>💰 Mes fiches de vacation</h6>
          <button onClick={() => navigate("/vacations")}
            style={{ padding: "6px 14px", background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            Voir tout →
          </button>
        </div>
        {vacations.length === 0 ? (
          <div style={{ color: "#94a3b8", fontSize: 13 }}>Aucune fiche generee.</div>
        ) : (
          vacations.slice(0, 4).map((v, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{MOIS[v.mois - 1]} {v.annee}</div>
                <div style={{ color: "#64748b", fontSize: 11 }}>{v.nb_seances} seances — {parseFloat(v.total_heures || 0).toFixed(1)}h</div>
                {v.statut === "generee" && <div style={{ color: "#a16207", fontSize: 11, fontWeight: 600 }}>⚠️ Votre signature requise</div>}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, color: "#15803d" }}>{parseFloat(v.montant_net).toLocaleString()} FCFA</div>
                <span style={{ fontSize: 10, color: "#64748b" }}>{v.statut}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
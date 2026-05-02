import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const MOIS_COURT = ["Janv","Fev","Mars","Avr","Mai","Juin","Juil","Aout","Sept","Oct","Nov","Dec"];

export default function DashboardAdmin() {
  const { headersAuth } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats]             = useState({ seances_aujourd_hui: 0, taux_presence: 0, retards_aujourd_hui: 0, cahiers_non_signes: 0 });
  const [vacations, setVacations]     = useState([]);
  const [pointages, setPointages]     = useState([]);
  const [heures, setHeures]           = useState([]);
  const [avancements, setAvancements] = useState([]);
  const [graphData, setGraphData]     = useState([]);
  const [chargement, setChargement]   = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const h = headersAuth();

    fetch("/api/vacations.php?action=stats", { headers: h })
      .then((r) => r.json())
      .then((d) => { setStats(d.data || {}); setChargement(false); })
      .catch(() => setChargement(false));

    fetch("/api/vacations.php?action=liste", { headers: h })
      .then((r) => r.json())
      .then((d) => setVacations((d.data || []).slice(0, 3)));

    fetch("/api/pointages.php?action=liste", { headers: h })
      .then((r) => r.json())
      .then((d) => setPointages((d.data || []).slice(0, 5)));

    fetch("/api/vacations.php?action=heures_semaine", { headers: h })
      .then((r) => r.json())
      .then((d) => setHeures(d.data || []))
      .catch(() => {});

    fetch("/api/vacations.php?action=avancement_programmes", { headers: h })
      .then((r) => r.json())
      .then((d) => setAvancements(d.data || []))
      .catch(() => {});

    // ✅ Données pour le graphique en ligne — séances par semaine
    fetch("/api/vacations.php?action=seances_par_semaine", { headers: h })
      .then((r) => r.json())
      .then((d) => setGraphData(d.data || []))
      .catch(() => {});
  }, []);

  const cartes = [
    { valeur: stats.seances_aujourd_hui ?? 0,     label: "Seances aujourd'hui", couleur: "#0d6efd", bg: "#eff6ff", icon: "📅" },
    { valeur: (stats.taux_presence ?? 0) + "%",   label: "Taux de presence",    couleur: "#22c55e", bg: "#f0fdf4", icon: "✅" },
    { valeur: stats.retards_aujourd_hui ?? 0,      label: "Retards",             couleur: "#f59e0b", bg: "#fffbeb", icon: "⏰" },
    { valeur: stats.cahiers_non_signes ?? 0,        label: "Cahiers non signes",  couleur: "#ef4444", bg: "#fef2f2", icon: "📋" },
  ];

  const acces = [
    { label: "Emploi du temps", path: "/emploi-temps", couleur: "#0d6efd", bg: "#eff6ff", icon: "📅" },
    { label: "Pointage QR",     path: "/pointage",     couleur: "#22c55e", bg: "#f0fdf4", icon: "📱" },
    { label: "Cahiers",         path: "/cahiers",      couleur: "#8b5cf6", bg: "#f5f3ff", icon: "📓" },
    { label: "Vacations",       path: "/vacations",    couleur: "#f59e0b", bg: "#fffbeb", icon: "💰" },
  ];

  const vacationsEnAttente = vacations.filter((v) => !["approuvee","payee"].includes(v.statut));

  if (chargement) return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;

  return (
    <div>
      <h2 style={{ fontWeight: 700, fontSize: 24, color: "#0f172a", marginBottom: 4 }}>Tableau de bord</h2>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>Vue d'ensemble de l'activite pedagogique</p>

      {/* Alerte vacations bloquées */}
      {vacationsEnAttente.length > 0 && (
        <div style={{ background: "#fffbeb", border: "1px solid #fbbf24", borderRadius: 10, padding: 16, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: "#a16207", marginBottom: 6 }}>
            ⚠️ {vacationsEnAttente.length} fiche(s) de vacation en attente de validation
          </div>
          <span onClick={() => navigate("/vacations")} style={{ color: "#0d6efd", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
            Voir les vacations →
          </span>
        </div>
      )}

      {/* Cartes statistiques */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {cartes.map((c) => (
          <div key={c.label} style={{ background: c.bg, borderRadius: 12, padding: 20, border: `1px solid ${c.couleur}20` }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{c.icon}</div>
            <div style={{ fontWeight: 800, fontSize: 28, color: c.couleur }}>{c.valeur}</div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Acces rapides */}
      <h5 style={{ fontWeight: 700, marginBottom: 12, color: "#0f172a" }}>Acces rapides</h5>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {acces.map((item) => (
          <div key={item.path} onClick={() => navigate(item.path)}
            style={{ background: item.bg, borderRadius: 10, padding: 16, textAlign: "center", cursor: "pointer", border: `1px solid ${item.couleur}30` }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
            <div style={{ fontWeight: 600, color: item.couleur, fontSize: 14 }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* ✅ Graphique en ligne — évolution des séances par semaine */}
      <div style={{ background: "white", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 16 }}>
        <h6 style={{ fontWeight: 700, marginBottom: 16, color: "#0f172a" }}>
          📈 Evolution des seances par semaine
        </h6>
        {graphData.length === 0 ? (
          <div style={{ color: "#94a3b8", fontSize: 13 }}>Aucune donnee disponible</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={graphData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="semaine" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                formatter={(value, name) => [value, name === "planifiees" ? "Planifiees" : name === "realisees" ? "Realisees" : "Cloturees"]}
              />
              <Legend formatter={(value) => value === "planifiees" ? "Planifiees" : value === "realisees" ? "Realisees" : "Cloturees"} />
              <Line type="monotone" dataKey="planifiees" stroke="#0d6efd" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="realisees"  stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="cloturees"  stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Heures planifiées vs réalisées */}
      <div style={{ background: "white", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 16 }}>
        <h6 style={{ fontWeight: 700, marginBottom: 16, color: "#0f172a" }}>📊 Heures planifiees vs realisees (semaine en cours)</h6>
        {heures.length === 0 ? (
          <div style={{ color: "#94a3b8", fontSize: 13 }}>Aucune donnee disponible</div>
        ) : (
          heures.map((h, i) => {
            const pct = h.planifiees > 0 ? Math.min(Math.round((h.realisees / h.planifiees) * 100), 100) : 0;
            return (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{h.classe}</span>
                  <span style={{ color: "#64748b" }}>{h.realisees}h / {h.planifiees}h planifiees</span>
                </div>
                <div style={{ background: "#f1f5f9", borderRadius: 20, height: 8, overflow: "hidden" }}>
                  <div style={{ width: pct + "%", height: "100%", background: pct >= 100 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444", borderRadius: 20, transition: "width 0.5s" }} />
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{pct}% realise</div>
              </div>
            );
          })
        )}
      </div>

      {/* Avancement des programmes */}
      <div style={{ background: "white", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 16 }}>
        <h6 style={{ fontWeight: 700, marginBottom: 16, color: "#0f172a" }}>
          📚 Avancement des programmes par matiere et classe
        </h6>
        {avancements.length === 0 ? (
          <div style={{ color: "#94a3b8", fontSize: 13 }}>Aucune donnee disponible</div>
        ) : (
          avancements.map((a, i) => {
            const pct = Math.min(Math.round(a.avancement_moyen || 0), 100);
            const couleur = pct >= 75 ? "#22c55e" : pct >= 50 ? "#0d6efd" : pct >= 25 ? "#f59e0b" : "#ef4444";
            return (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span>
                    <span style={{ fontWeight: 600 }}>{a.matiere}</span>
                    <span style={{ color: "#64748b", marginLeft: 6 }}>— {a.classe}</span>
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#64748b", fontSize: 12 }}>{a.nb_seances} seance(s)</span>
                    <span style={{ color: couleur, fontWeight: 700 }}>{pct}%</span>
                  </div>
                </div>
                <div style={{ background: "#f1f5f9", borderRadius: 20, height: 10, overflow: "hidden" }}>
                  <div style={{ width: pct + "%", height: "100%", background: `linear-gradient(90deg, ${couleur}88, ${couleur})`, borderRadius: 20, transition: "width 0.5s" }} />
                </div>
              </div>
            );
          })
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Derniers pointages */}
        <div style={{ background: "white", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <h6 style={{ fontWeight: 700, marginBottom: 16, color: "#0f172a" }}>Derniers pointages</h6>
          {pointages.length === 0 ? (
            <div style={{ color: "#94a3b8", fontSize: 13 }}>Aucun pointage enregistre</div>
          ) : (
            pointages.map((p, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{p.enseignant}</div>
                  <div style={{ color: "#64748b", fontSize: 12 }}>{p.matiere} — {p.jour}</div>
                </div>
                <span style={{ background: p.statut === "valide" ? "#dcfce7" : "#fef9c3", color: p.statut === "valide" ? "#15803d" : "#a16207", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, alignSelf: "center" }}>
                  {p.statut}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Dernières vacations */}
        <div style={{ background: "white", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <h6 style={{ fontWeight: 700, marginBottom: 16, color: "#0f172a" }}>Dernieres vacations</h6>
          {vacations.length === 0 ? (
            <div style={{ color: "#94a3b8", fontSize: 13 }}>Aucune vacation generee</div>
          ) : (
            vacations.map((v, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{v.enseignant}</div>
                  <div style={{ color: "#64748b", fontSize: 12 }}>{MOIS_COURT[v.mois-1]} {v.annee}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, color: "#0d6efd", fontSize: 13 }}>{parseFloat(v.montant_net).toLocaleString()} FCFA</div>
                  <span style={{ background: "#dcfce7", color: "#15803d", padding: "1px 6px", borderRadius: 10, fontSize: 10 }}>{v.statut}</span>
                </div>
              </div>
            ))
          )}
          <button onClick={() => navigate("/vacations")}
            style={{ width: "100%", marginTop: 12, padding: "8px", background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            Voir toutes les vacations →
          </button>
        </div>
      </div>
    </div>
  );
}
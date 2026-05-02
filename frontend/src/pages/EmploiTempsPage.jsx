import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import CreneauForm from "./CreneauForm";

const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const COULEURS = [
  { bg: "#eef2ff", border: "#6366f1", text: "#4338ca" },
  { bg: "#f0fdf4", border: "#22c55e", text: "#15803d" },
  { bg: "#fff7ed", border: "#f97316", text: "#c2410c" },
  { bg: "#fdf4ff", border: "#d946ef", text: "#a21caf" },
  { bg: "#f0f9ff", border: "#0ea5e9", text: "#0369a1" },
  { bg: "#fefce8", border: "#eab308", text: "#a16207" },
  { bg: "#fff1f2", border: "#f43f5e", text: "#be123c" },
  { bg: "#f0fdfa", border: "#14b8a6", text: "#0f766e" },
];

// Jours fériés Burkina Faso 2026
const JOURS_FERIES = {
  "2026-01-01": "Jour de l'An",
  "2026-01-03": "Soulèvement populaire",
  "2026-03-08": "Journée de la Femme",
  "2026-04-06": "Lundi de Pâques",
  "2026-05-01": "Fête du Travail",
  "2026-05-14": "Ascension",
  "2026-08-05": "Fête Nationale",
  "2026-08-15": "Assomption",
  "2026-11-01": "Toussaint",
  "2026-11-11": "Commémoration",
  "2026-12-11": "Proclamation de la République",
  "2026-12-25": "Noël",
};

// Obtenir le lundi de n'importe quelle date
const getLundiDeLaSemaine = (dateStr) => {
  const d = new Date(dateStr);
  const jour = d.getDay();
  const diff = jour === 0 ? -6 : 1 - jour;
  const lundi = new Date(d);
  lundi.setDate(d.getDate() + diff);
  return lundi.toISOString().split('T')[0];
};

// Calculer la date d'un jour de la semaine
const getDateJour = (semaineDebut, nomJour) => {
  const idx = JOURS.indexOf(nomJour);
  if (idx === -1) return null;
  const d = new Date(semaineDebut);
  d.setDate(d.getDate() + idx);
  return d.toISOString().split("T")[0];
};

export default function EmploiTempsPage() {
  const { headersAuth, aLeRole } = useAuth();
  const [classes, setClasses]         = useState([]);
  const [planning, setPlanning]       = useState({});
  const [idClasse, setIdClasse]       = useState("");
  const [nomClasse, setNomClasse]     = useState("");
  const [chargement, setChargement]   = useState(false);
  const [showForm, setShowForm]       = useState(false);
  const [semaine, setSemaine]         = useState(getLundiDeLaSemaine(new Date().toISOString().split('T')[0]));
  const [semaineAffichee, setSemaineAffichee] = useState(""); // semaine réellement affichée par l'API
  const [creneauEdit, setCreneauEdit] = useState(null);
  const [enseignants, setEnseignants] = useState([]);
  const [matieres, setMatieres]       = useState([]);
  const [salles, setSalles]           = useState([]);

  // Filtres dynamiques
  const [filtreEnseignant, setFiltreEnseignant] = useState("");
  const [filtreSalle, setFiltreSalle]           = useState("");
  const [filtreMatiere, setFiltreMatiere]       = useState("");

  // Modals
  const [qrModal, setQrModal]       = useState(null);
  const [showFeries, setShowFeries] = useState(false);
  const [jourFerieForm, setJourFerieForm] = useState({ date: "", libelle: "" });
  const [feriesPerso, setFeriesPerso]     = useState({});

  const tousLesFeries = { ...JOURS_FERIES, ...feriesPerso };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const h = headersAuth();
    fetch("/api/emploi_temps.php", { headers: h }).then(r => r.json()).then(d => setClasses(d.data || []));
    fetch("/api/emploi_temps.php?type=enseignants", { headers: h }).then(r => r.json()).then(d => setEnseignants(d.data || []));
    fetch("/api/emploi_temps.php?type=matieres", { headers: h }).then(r => r.json()).then(d => setMatieres(d.data || []));
    fetch("/api/emploi_temps.php?type=salles", { headers: h }).then(r => r.json()).then(d => setSalles(d.data || []));
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!idClasse) { setPlanning({}); return; }
    setChargement(true);
    fetch(`/api/emploi_temps.php?id_classe=${idClasse}&semaine=${semaine}`, { headers: headersAuth() })
      .then(r => r.json())
      .then(data => {
        setPlanning(data.data || {});
        setSemaineAffichee(data.semaine_affichee || semaine);
        setChargement(false);
      });
  }, [idClasse, semaine]);

  const rechargerPlanning = () => {
    setChargement(true);
    fetch(`/api/emploi_temps.php?id_classe=${idClasse}&semaine=${semaine}`, { headers: headersAuth() })
      .then(r => r.json())
      .then(d => {
        setPlanning(d.data || {});
        setSemaineAffichee(d.semaine_affichee || semaine);
        setChargement(false);
      });
  };

  const supprimerCreneau = async (id) => {
    if (!window.confirm("Supprimer ce creneau ?")) return;
    await fetch("/api/emploi_temps.php?action=supprimer", {
      method: "POST", headers: headersAuth(), body: JSON.stringify({ id }),
    });
    rechargerPlanning();
  };

  const modifierCreneau = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/emploi_temps.php?action=modifier", {
      method: "POST", headers: headersAuth(),
      body: JSON.stringify({
        id: creneauEdit.id, jour: creneauEdit.jour,
        heure_debut: creneauEdit.heure_debut, heure_fin: creneauEdit.heure_fin,
        id_matiere: creneauEdit.id_matiere, id_enseignant: creneauEdit.id_enseignant,
        id_salle: creneauEdit.id_salle,
      }),
    });
    const data = await res.json();
    if (data.succes) { setCreneauEdit(null); rechargerPlanning(); }
    else alert("Erreur : " + (data.erreur || "inconnue"));
  };

  const dupliquerSemaine = async () => {
    if (!window.confirm("Dupliquer ce planning vers la semaine suivante ?")) return;
    const res = await fetch("/api/emploi_temps.php?action=dupliquer", {
      method: "POST", headers: headersAuth(),
      body: JSON.stringify({ id_classe: idClasse, semaine_actuelle: semaineAffichee || semaine }),
    });
    const data = await res.json();
    if (data.succes) alert(`${data.nb_creneaux} créneaux dupliqués vers la semaine du ${data.semaine_suivante}`);
    else alert("Erreur : " + (data.erreur || "inconnue"));
  };

  const genererQR = async (idCreneau) => {
    setQrModal({ chargement: true });
    const res = await fetch(`/api/pointages.php?action=generer_qr&id_creneau=${idCreneau}`, { headers: headersAuth() });
    const data = await res.json();
    if (data.succes) setQrModal(data);
    else { alert("Erreur : " + (data.erreur || "Impossible de generer le QR Code")); setQrModal(null); }
  };

  // Export PDF
  const exporterPDF = () => {
    const printWindow = window.open("", "_blank");
    const semActuelle = semaineAffichee || semaine;
    const dateDebut = new Date(semActuelle).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    let html = `<html><head><title>Emploi du temps — ${nomClasse}</title>
    <style>body{font-family:Arial,sans-serif;padding:20px;color:#0f172a}h1{font-size:18px;margin-bottom:4px}.sous-titre{color:#64748b;font-size:13px;margin-bottom:20px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#0f172a;color:white;padding:10px 8px;text-align:center;font-weight:600;text-transform:capitalize}td{border:1px solid #e2e8f0;padding:8px;vertical-align:top;min-height:60px}.creneau{background:#eef2ff;border-left:3px solid #6366f1;border-radius:4px;padding:6px 8px;margin-bottom:4px}.matiere{font-weight:700;font-size:11px;color:#4338ca}.details{font-size:10px;color:#64748b;margin-top:2px}.ferie{background:#fee2e2;text-align:center;color:#dc2626;font-weight:600;font-size:11px;padding:8px;border-radius:4px}.libre{color:#cbd5e1;font-size:11px;text-align:center;padding:20px 0}</style>
    </head><body><h1>📅 Emploi du temps — ${nomClasse}</h1>
    <div class="sous-titre">Semaine du ${dateDebut} · EduSchedule Pro — ISGE</div>
    <table><thead><tr>${JOURS.map(j => `<th>${j}</th>`).join('')}</tr></thead><tbody><tr>`;
    JOURS.forEach(jour => {
      const dateJour = getDateJour(semActuelle, jour);
      const estFerie = dateJour && tousLesFeries[dateJour];
      const cours = planningFiltre[jour] || [];
      html += `<td>`;
      if (estFerie) html += `<div class="ferie">🎉 ${tousLesFeries[dateJour]}</div>`;
      else if (cours.length === 0) html += `<div class="libre">Libre</div>`;
      else cours.forEach(c => {
        html += `<div class="creneau"><div class="matiere">${c.matiere}</div><div class="details">${c.heure_debut.slice(0,5)} – ${c.heure_fin.slice(0,5)}</div><div class="details">${c.enseignant}</div><div class="details">🚪 ${c.salle}</div></div>`;
      });
      html += `</td>`;
    });
    html += `</tr></tbody></table><div style="margin-top:20px;font-size:11px;color:#94a3b8;text-align:center">Généré par EduSchedule Pro — ISGE — 2025-2026</div></body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  // Filtres
  const planningFiltre = {};
  JOURS.forEach(jour => {
    let cours = planning[jour] || [];
    if (filtreEnseignant) cours = cours.filter(c => c.id_enseignant?.toString() === filtreEnseignant);
    if (filtreSalle)      cours = cours.filter(c => c.id_salle?.toString() === filtreSalle);
    if (filtreMatiere)    cours = cours.filter(c => c.id_matiere?.toString() === filtreMatiere);
    planningFiltre[jour] = cours;
  });

  const totalCours = Object.values(planningFiltre).reduce((acc, j) => acc + j.length, 0);
  const semAffichee = semaineAffichee || semaine;
  const inputStyle = { width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 13, boxSizing: "border-box" };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>

      {/* En-tête */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: 24, color: "#0f172a", marginBottom: 4 }}>Emploi du temps</h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>Planning hebdomadaire par classe</p>
        </div>
        {aLeRole("administrateur") && idClasse && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => { setShowForm(!showForm); setCreneauEdit(null); }}
              style={{ padding: "10px 20px", background: showForm ? "#f1f5f9" : "#0d6efd", color: showForm ? "#475569" : "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
              {showForm ? "Annuler" : "+ Ajouter un creneau"}
            </button>
            <button onClick={dupliquerSemaine}
              style={{ padding: "10px 20px", background: "#f0fdf4", color: "#15803d", border: "1px solid #86efac", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
              Dupliquer →
            </button>
            <button onClick={exporterPDF}
              style={{ padding: "10px 20px", background: "#fdf4ff", color: "#a21caf", border: "1px solid #e879f9", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
              📄 Export PDF
            </button>
            <button onClick={() => setShowFeries(!showFeries)}
              style={{ padding: "10px 20px", background: "#fff7ed", color: "#c2410c", border: "1px solid #fdba74", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
              🎉 Jours fériés
            </button>
          </div>
        )}
      </div>

      {/* Panel jours fériés */}
      {showFeries && (
        <div style={{ background: "white", borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #fdba74" }}>
          <h5 style={{ fontWeight: 700, marginBottom: 16, color: "#c2410c" }}>🎉 Gestion des Jours Fériés</h5>
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <input type="date" value={jourFerieForm.date} onChange={e => setJourFerieForm({ ...jourFerieForm, date: e.target.value })}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }} />
            <input type="text" value={jourFerieForm.libelle} placeholder="Nom du jour férié"
              onChange={e => setJourFerieForm({ ...jourFerieForm, libelle: e.target.value })}
              style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, minWidth: 200 }} />
            <button onClick={() => {
              if (!jourFerieForm.date || !jourFerieForm.libelle) return;
              setFeriesPerso({ ...feriesPerso, [jourFerieForm.date]: jourFerieForm.libelle });
              setJourFerieForm({ date: "", libelle: "" });
            }} style={{ padding: "8px 20px", background: "#f97316", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
              + Ajouter
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {Object.entries(tousLesFeries).map(([date, libelle]) => (
              <div key={date} style={{ background: "#fff7ed", border: "1px solid #fdba74", borderRadius: 8, padding: "4px 12px", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#c2410c", fontWeight: 600 }}>{date}</span>
                <span style={{ color: "#64748b" }}>{libelle}</span>
                {feriesPerso[date] && (
                  <button onClick={() => { const f = { ...feriesPerso }; delete f[date]; setFeriesPerso(f); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: 14 }}>✕</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div style={{ marginBottom: 24 }}>
          <CreneauForm idClasse={idClasse} semaineDebut={semAffichee}
            onSuccess={() => { setShowForm(false); rechargerPlanning(); }}
            onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Modal modifier créneau */}
      {creneauEdit && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", borderRadius: 12, padding: 24, width: 460, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
            <h5 style={{ fontWeight: 700, marginBottom: 20 }}>Modifier le creneau</h5>
            <form onSubmit={modifierCreneau}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div><label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Jour</label>
                  <select value={creneauEdit.jour} onChange={e => setCreneauEdit({ ...creneauEdit, jour: e.target.value })} style={inputStyle}>
                    {JOURS.map(j => <option key={j} value={j}>{j}</option>)}
                  </select></div>
                <div><label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Matiere</label>
                  <select value={creneauEdit.id_matiere} onChange={e => setCreneauEdit({ ...creneauEdit, id_matiere: e.target.value })} style={inputStyle}>
                    {matieres.map(m => <option key={m.id} value={m.id}>{m.libelle}</option>)}
                  </select></div>
                <div><label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Heure debut</label>
                  <input type="time" value={creneauEdit.heure_debut?.slice(0,5)} onChange={e => setCreneauEdit({ ...creneauEdit, heure_debut: e.target.value })} style={inputStyle} /></div>
                <div><label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Heure fin</label>
                  <input type="time" value={creneauEdit.heure_fin?.slice(0,5)} onChange={e => setCreneauEdit({ ...creneauEdit, heure_fin: e.target.value })} style={inputStyle} /></div>
              </div>
              <div style={{ marginBottom: 12 }}><label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Enseignant</label>
                <select value={creneauEdit.id_enseignant} onChange={e => setCreneauEdit({ ...creneauEdit, id_enseignant: e.target.value })} style={inputStyle}>
                  {enseignants.map(e => <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
                </select></div>
              <div style={{ marginBottom: 20 }}><label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Salle</label>
                <select value={creneauEdit.id_salle} onChange={e => setCreneauEdit({ ...creneauEdit, id_salle: e.target.value })} style={inputStyle}>
                  {salles.map(s => <option key={s.id} value={s.id}>{s.code}</option>)}
                </select></div>
              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" onClick={modifierCreneau} style={{ flex: 1, padding: 10, background: "#0d6efd", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Enregistrer</button>
                <button type="button" onClick={() => setCreneauEdit(null)} style={{ flex: 1, padding: 10, background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal QR */}
      {qrModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", borderRadius: 12, padding: 24, width: 420, boxShadow: "0 8px 32px rgba(0,0,0,0.3)", textAlign: "center" }}>
            {qrModal.chargement ? (
              <div style={{ padding: 40 }}><div className="spinner-border text-primary" /><div style={{ marginTop: 12, color: "#64748b" }}>Generation...</div></div>
            ) : (
              <>
                <h5 style={{ fontWeight: 700, marginBottom: 16 }}>📱 QR Code de pointage</h5>
                <div style={{ background: "#f8fafc", borderRadius: 8, padding: 12, marginBottom: 16, textAlign: "left", fontSize: 13 }}>
                  <div style={{ fontWeight: 700 }}>{qrModal.seance?.matiere}</div>
                  <div style={{ color: "#64748b" }}>{qrModal.seance?.enseignant} · {qrModal.seance?.salle}</div>
                  <div style={{ color: "#dc2626", fontSize: 12 }}>⏰ Expire : {qrModal.expire}</div>
                </div>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrModal.url_pointage)}`} alt="QR" style={{ width: 200, height: 200, marginBottom: 16 }} />
                {/* URL de pointage avec token */}
<div style={{ background: "#f0f9ff", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 11, color: "#0369a1", wordBreak: "break-all", textAlign: "left" }}>
  🔗 {qrModal.url_pointage}
</div>

{/* Token seul */}
<div style={{ background: "#f0fdf4", borderRadius: 8, padding: "8px 14px", marginBottom: 16, fontSize: 12, color: "#15803d" }}>
  🔑 Token : <strong style={{ wordBreak: "break-all", fontSize: 11 }}>{qrModal.token}</strong>
</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => window.print()} style={{ flex: 1, padding: 10, background: "#0d6efd", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>🖨️ Imprimer</button>
                  <button onClick={() => setQrModal(null)} style={{ flex: 1, padding: 10, background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Fermer</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Filtres */}
      <div style={{ background: "white", borderRadius: 12, padding: "16px 20px", marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <select value={idClasse} onChange={e => {
            setIdClasse(e.target.value);
            const cl = classes.find(c => c.id?.toString() === e.target.value);
            setNomClasse(cl ? cl.libelle : "");
          }} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, background: "#f8fafc", minWidth: 220 }}>
            <option value="">Selectionner une classe</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.libelle}</option>)}
          </select>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
  <button onClick={() => {
    const d = new Date(semaine + 'T12:00:00');
    d.setDate(d.getDate() - 7);
    setSemaine(d.toISOString().split('T')[0]);
  }} style={{ padding: "8px 14px", background: "#f1f5f9", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, color: "#475569", fontSize: 13 }}>
    ← Préc.
  </button>

  <label style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Semaine :</label>
  <input type="date" value={semaine}
    onChange={e => setSemaine(e.target.value)}
    style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, background: "#f8fafc" }} />

  <button onClick={() => {
    const d = new Date(semaine + 'T12:00:00');
    d.setDate(d.getDate() + 7);
    setSemaine(d.toISOString().split('T')[0]);
  }} style={{ padding: "8px 14px", background: "#f1f5f9", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, color: "#475569", fontSize: 13 }}>
    Suiv. →
  </button>
</div>

          {/* Indicateur semaine affichée si différente */}
          {semaineAffichee && semaineAffichee !== semaine && (
            <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "#92400e" }}>
              📅 Planning de la semaine du {semaineAffichee}
            </div>
          )}

          {idClasse && !chargement && (
            <div style={{ marginLeft: "auto", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "6px 14px", fontSize: 13, color: "#15803d", fontWeight: 500 }}>
              {totalCours} cours cette semaine
            </div>
          )}
        </div>

        {/* Filtres dynamiques */}
        {idClasse && (
          <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
            <select value={filtreEnseignant} onChange={e => setFiltreEnseignant(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, background: "#f8fafc", minWidth: 180 }}>
              <option value="">Tous les enseignants</option>
              {enseignants.map(e => <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
            </select>
            <select value={filtreSalle} onChange={e => setFiltreSalle(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, background: "#f8fafc", minWidth: 150 }}>
              <option value="">Toutes les salles</option>
              {salles.map(s => <option key={s.id} value={s.id}>{s.code}</option>)}
            </select>
            <select value={filtreMatiere} onChange={e => setFiltreMatiere(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, background: "#f8fafc", minWidth: 180 }}>
              <option value="">Toutes les matières</option>
              {matieres.map(m => <option key={m.id} value={m.id}>{m.libelle}</option>)}
            </select>
            {(filtreEnseignant || filtreSalle || filtreMatiere) && (
              <button onClick={() => { setFiltreEnseignant(""); setFiltreSalle(""); setFiltreMatiere(""); }}
                style={{ padding: "6px 14px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                ✕ Réinitialiser
              </button>
            )}
          </div>
        )}
      </div>

      {!idClasse && (
        <div style={{ textAlign: "center", padding: "80px 20px", background: "white", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
          <div style={{ fontSize: 16, color: "#64748b", fontWeight: 500 }}>Selectionnez une classe pour afficher son planning</div>
        </div>
      )}

      {chargement && <div style={{ textAlign: "center", padding: 60 }}><div className="spinner-border text-primary" /></div>}

      {!chargement && idClasse && (
        <div style={{ background: "white", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", background: "#0f172a" }}>
            {JOURS.map(jour => {
              const dateJour = getDateJour(semAffichee, jour);
              const estFerie = dateJour && tousLesFeries[dateJour];
              return (
                <div key={jour} style={{ padding: "14px 8px", textAlign: "center", borderRight: "1px solid #1e293b" }}>
                  <div style={{ color: estFerie ? "#fbbf24" : "white", fontWeight: 600, fontSize: 13, textTransform: "capitalize" }}>{jour}</div>
                  {dateJour && <div style={{ color: "#64748b", fontSize: 10, marginTop: 2 }}>{new Date(dateJour + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</div>}
                  {estFerie && <div style={{ color: "#fbbf24", fontSize: 9, marginTop: 2 }}>🎉 Férié</div>}
                </div>
              );
            })}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", minHeight: 300 }}>
            {JOURS.map((jour, ji) => {
              const dateJour = getDateJour(semAffichee, jour);
              const estFerie = dateJour && tousLesFeries[dateJour];
              const cours = planningFiltre[jour] || [];
              return (
                <div key={jour} style={{ padding: 10, borderRight: ji < 5 ? "1px solid #f1f5f9" : "none", background: estFerie ? "#fff7ed" : cours.length === 0 ? "#fafafa" : "white" }}>
                  {estFerie ? (
                    <div style={{ textAlign: "center", padding: "20px 8px" }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>🎉</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#c2410c" }}>{tousLesFeries[dateJour]}</div>
                      <div style={{ fontSize: 10, color: "#f97316", marginTop: 4 }}>Jour férié</div>
                    </div>
                  ) : cours.length === 0 ? (
                    <div style={{ height: "100%", minHeight: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "#cbd5e1", fontSize: 12 }}>Libre</div>
                  ) : (
                    cours.map((c, i) => {
                      const coul = COULEURS[i % COULEURS.length];
                      return (
                        <div key={c.id} style={{ background: coul.bg, borderLeft: `3px solid ${coul.border}`, borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
                          <div style={{ fontWeight: 700, fontSize: 12, color: coul.text, marginBottom: 4 }}>{c.matiere}</div>
                          <div style={{ fontSize: 11, color: "#475569", marginBottom: 2 }}>{c.heure_debut.slice(0,5)} — {c.heure_fin.slice(0,5)}</div>
                          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>{c.enseignant}</div>
                          <div style={{ display: "inline-block", background: "rgba(0,0,0,0.06)", borderRadius: 4, padding: "1px 6px", fontSize: 10, color: "#64748b", marginBottom: 6 }}>{c.salle}</div>
                          {aLeRole("administrateur") && (
                            <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                              <button onClick={() => genererQR(c.id)} style={{ flex: 1, padding: "3px 0", background: "#f0fdf4", color: "#15803d", border: "1px solid #86efac", borderRadius: 4, cursor: "pointer", fontSize: 10, fontWeight: 600 }}>📱 QR</button>
                              <button onClick={() => setCreneauEdit({ id: c.id, jour: c.jour, heure_debut: c.heure_debut, heure_fin: c.heure_fin, id_matiere: c.id_matiere, id_enseignant: c.id_enseignant, id_salle: c.id_salle })}
                                style={{ flex: 1, padding: "3px 0", background: "#e0f2fe", color: "#0369a1", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 10, fontWeight: 600 }}>Modifier</button>
                              <button onClick={() => supprimerCreneau(c.id)} style={{ flex: 1, padding: "3px 0", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 10, fontWeight: 600 }}>Supprimer</button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

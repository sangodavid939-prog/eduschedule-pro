import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

const COULEURS_MATIERES = [
  "#3b82f6", "#22c55e", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6",
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

// Obtenir la date d'un jour de la semaine
const getDateJour = (semaineDebut, jourNom) => {
  const JOURS_EN = ["lundi","mardi","mercredi","jeudi","vendredi","samedi"];
  const jourNormalise = jourNom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const idx = JOURS_EN.indexOf(jourNormalise);
  if (idx === -1) return null;
  const d = new Date(semaineDebut + 'T12:00:00');
  d.setDate(d.getDate() + idx);
  return d.toISOString().split("T")[0];
};

export default function DashboardEtudiant() {
  const { utilisateur, headersAuth, deconnexion } = useAuth();
  const [emploiDuTemps, setEmploiDuTemps] = useState([]);
  const [chargement, setChargement]       = useState(true);
  const [erreur, setErreur]               = useState(null);
  const [jourActif, setJourActif]         = useState(new Date().getDay() || 1);
  const [semaine, setSemaine]             = useState(getLundiDeLaSemaine(new Date().toISOString().split('T')[0]));
  const jourIdx = Math.min(Math.max(jourActif - 1, 0), 5);

  const heureActuelle = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    const charger = async () => {
      setChargement(true);
      try {
        const rep = await fetch(`/api/emploi_temps.php?semaine=${semaine}`, { headers: headersAuth() });
        if (!rep.ok) throw new Error("Impossible de charger l'emploi du temps");
        const data = await rep.json();
        const tous = Object.values(data.data || {}).flat();
        setEmploiDuTemps(tous);
      } catch (e) {
        setErreur(e.message);
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, [headersAuth, semaine]);

  const couleurMatiere = (nom = "") => {
    let hash = 0;
    for (let i = 0; i < nom.length; i++) hash = nom.charCodeAt(i) + ((hash << 5) - hash);
    return COULEURS_MATIERES[Math.abs(hash) % COULEURS_MATIERES.length];
  };

  const coursJour = (jourNom) => {
    const jourNormalise = jourNom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return emploiDuTemps.filter(c => c.jour?.toLowerCase() === jourNormalise);
  };

  const coursEnCours = (() => {
    const dateAujourdhui = new Date().toISOString().split('T')[0];
    if (JOURS_FERIES[dateAujourdhui]) return null;
    return emploiDuTemps.find((c) => {
      const jourNormalise = JOURS[jourIdx].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (c.jour?.toLowerCase() !== jourNormalise) return false;
      const debut = c.heure_debut?.substring(0, 5);
      const fin   = c.heure_fin?.substring(0, 5);
      const semaineActuelle = getLundiDeLaSemaine(new Date().toISOString().split('T')[0]);
      const estAujourdhui = semaine === semaineActuelle && new Date().getDay() === jourIdx + 1;
      return estAujourdhui && heureActuelle >= debut && heureActuelle <= fin;
    });
  })();
  
  const changerSemaine = (direction) => {
    const date = new Date(semaine + 'T12:00:00');
    date.setDate(date.getDate() + direction * 7);
    setSemaine(date.toISOString().split('T')[0]);
  };

  const formatSemaine = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    const fin = new Date(dateStr + 'T12:00:00');
    fin.setDate(fin.getDate() + 6);
    return `${d.getDate()} – ${fin.getDate()} ${fin.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
  };

  // Vérifier si le jour sélectionné est férié
  const dateJourSelectionne = getDateJour(semaine, JOURS[jourIdx]);
  const jourFerie = dateJourSelectionne && JOURS_FERIES[dateJourSelectionne];

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #3730a3 60%, #8b5cf6 100%)",
        padding: "20px 32px", display: "flex", alignItems: "center",
        justifyContent: "space-between", boxShadow: "0 4px 24px rgba(139,92,246,0.3)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, border: "1.5px solid rgba(255,255,255,0.2)" }}>🎓</div>
          <div>
            <div style={{ color: "white", fontWeight: 800, fontSize: 18 }}>Bonjour, {utilisateur?.nom || "Étudiant"} 👋</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>Espace étudiant · Lecture seule</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 16px", color: "rgba(255,255,255,0.8)", fontSize: 13, border: "1px solid rgba(255,255,255,0.15)" }}>
            🕐 {heureActuelle}
          </div>
          <button onClick={deconnexion} style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 10, padding: "8px 16px", color: "#fca5a5", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            Déconnexion
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 24px" }}>

        {/* Cours en cours */}
        {coursEnCours && (
          <div style={{ background: "linear-gradient(135deg, #065f46, #059669)", borderRadius: 16, padding: "16px 24px", marginBottom: 24, display: "flex", alignItems: "center", gap: 16, boxShadow: "0 4px 20px rgba(5,150,105,0.3)" }}>
            <div style={{ fontSize: 32 }}>📖</div>
            <div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Cours en ce moment</div>
              <div style={{ color: "white", fontWeight: 800, fontSize: 18 }}>{coursEnCours.matiere}</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                {coursEnCours.enseignant} · {coursEnCours.salle} · {coursEnCours.heure_debut?.substring(0,5)} – {coursEnCours.heure_fin?.substring(0,5)}
              </div>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: 20, padding: "4px 12px", color: "white", fontSize: 12, fontWeight: 700 }}>EN COURS</span>
            </div>
          </div>
        )}

        {/* Navigation semaine */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, background: "white", borderRadius: 14, padding: "12px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <button onClick={() => changerSemaine(-1)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 600, color: "#475569" }}>
            ← Semaine préc.
          </button>
          <div style={{ fontWeight: 700, color: "#1e1b4b", fontSize: 14 }}>
            📅 Semaine du {formatSemaine(semaine)}
          </div>
          <button onClick={() => changerSemaine(1)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 600, color: "#475569" }}>
            Semaine suiv. →
          </button>
        </div>

        {/* Sélecteur de jour */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {JOURS.map((jour, idx) => {
            const actif = idx === jourIdx;
            const dateJour = getDateJour(semaine, jour);
            const estFerie = dateJour && JOURS_FERIES[dateJour];
            const aDesCours = !estFerie && coursJour(jour).length > 0;
            return (
              <button key={jour} onClick={() => setJourActif(idx + 1)} style={{
                padding: "10px 20px", borderRadius: 12, border: "none",
                background: actif ? (estFerie ? "#f97316" : "#8b5cf6") : "white",
                color: actif ? "white" : estFerie ? "#c2410c" : aDesCours ? "#1e1b4b" : "#94a3b8",
                fontWeight: actif ? 700 : estFerie || aDesCours ? 600 : 400,
                cursor: "pointer", fontSize: 14,
                boxShadow: actif ? "0 4px 12px rgba(139,92,246,0.4)" : "0 1px 4px rgba(0,0,0,0.08)",
                transition: "all 0.15s", position: "relative",
              }}>
                {jour}
                {estFerie && !actif && <span style={{ fontSize: 10 }}> 🎉</span>}
                {aDesCours && !actif && (
                  <span style={{ position: "absolute", top: 4, right: 6, width: 6, height: 6, borderRadius: "50%", background: "#8b5cf6" }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Emploi du temps */}
        <div style={{ background: "white", borderRadius: 20, padding: 24, boxShadow: "0 1px 8px rgba(0,0,0,0.08)", marginBottom: 24 }}>
          <h2 style={{ fontWeight: 800, fontSize: 18, color: "#1e1b4b", marginBottom: 20 }}>
            📅 Emploi du temps — {JOURS[jourIdx]}
            {jourFerie && <span style={{ marginLeft: 12, fontSize: 13, color: "#f97316", fontWeight: 600 }}>🎉 {jourFerie}</span>}
          </h2>

          {chargement ? (
            <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>Chargement...
            </div>
          ) : erreur ? (
            <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: 16, color: "#dc2626" }}>⚠️ {erreur}</div>
          ) : (() => {
            // Vérifier jour férié EN PREMIER
            if (jourFerie) return (
              <div style={{ textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
                <div style={{ fontWeight: 800, color: "#c2410c", fontSize: 20, marginBottom: 8 }}>{jourFerie}</div>
                <div style={{ color: "#f97316", fontSize: 15 }}>Jour férié — pas de cours aujourd'hui</div>
                <div style={{ marginTop: 16, background: "#fff7ed", border: "1px solid #fdba74", borderRadius: 12, padding: "12px 20px", display: "inline-block" }}>
                  <span style={{ color: "#92400e", fontSize: 13 }}>Profitez de cette journée de repos ! 🌟</span>
                </div>
              </div>
            );

            // Pas de cours
            if (coursJour(JOURS[jourIdx]).length === 0) return (
              <div style={{ textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>😴</div>
                <div style={{ fontWeight: 700, color: "#1e1b4b", fontSize: 16 }}>Pas de cours ce jour</div>
                <div style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>Profitez de votre journée !</div>
              </div>
            );

            // Afficher les cours
            return coursJour(JOURS[jourIdx])
              .sort((a, b) => a.heure_debut?.localeCompare(b.heure_debut))
              .map((cours, i) => {
                const debut = cours.heure_debut?.substring(0, 5);
                const fin   = cours.heure_fin?.substring(0, 5);
                const semaineActuelle = getLundiDeLaSemaine(new Date().toISOString().split('T')[0]);
                const estAujourdhui = semaine === semaineActuelle && new Date().getDay() === jourIdx + 1;
                const enCours = estAujourdhui && heureActuelle >= debut && heureActuelle <= fin;
                return (
                  <div key={i} style={{ display: "flex", gap: 16, alignItems: "stretch", marginBottom: 12 }}>
                    <div style={{ width: 80, flexShrink: 0, textAlign: "center", color: enCours ? "#8b5cf6" : "#64748b", fontSize: 12, fontWeight: enCours ? 700 : 600, paddingTop: 6 }}>
                      {debut}<br /><span style={{ color: "#e2e8f0" }}>|</span><br />{fin}
                    </div>
                    <div style={{ flex: 1, borderRadius: 12, padding: "14px 18px", background: couleurMatiere(cours.matiere) + "12", borderLeft: `4px solid ${couleurMatiere(cours.matiere)}`, boxShadow: enCours ? `0 0 0 2px ${couleurMatiere(cours.matiere)}40` : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: "#1e1b4b" }}>{cours.matiere}</div>
                          <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
                            👤 {cours.enseignant} &nbsp;·&nbsp; 🚪 {cours.salle}
                          </div>
                        </div>
                        {enCours && (
                          <span style={{ background: "#8b5cf6", color: "white", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>EN COURS</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              });
          })()}
        </div>

        {/* Bannière lecture seule */}
        <div style={{ background: "linear-gradient(135deg, #1e1b4b, #3730a3)", borderRadius: 16, padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 28 }}>🔒</div>
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: 14 }}>Accès en lecture seule</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>Vous pouvez consulter votre emploi du temps. Pour toute modification, contactez votre administration.</div>
          </div>
        </div>

      </div>
    </div>
  );
}

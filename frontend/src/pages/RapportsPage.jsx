import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const MOIS = ["Janvier","Fevrier","Mars","Avril","Mai","Juin","Juillet","Aout","Septembre","Octobre","Novembre","Decembre"];

export default function RapportsPage() {
  const { headersAuth } = useAuth();
  const [chargement, setChargement] = useState(false);
  const [message, setMessage]       = useState("");
  const [erreur, setErreur]         = useState("");

  const [formPresence, setFormPresence] = useState({
    mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear(),
  });

  const [formVacation, setFormVacation] = useState({
    mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear(),
  });

  const inputStyle = { padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 };
  const labelStyle = { display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 };

  const genererRapportPresence = async () => {
    setChargement(true); setErreur(""); setMessage("");
    try {
      const res = await fetch(
        `/api/pointages.php?action=rapport&mois=${formPresence.mois}&annee=${formPresence.annee}`,
        { headers: headersAuth() }
      );
      const data = await res.json();
      if (!data.succes) { setErreur(data.erreur || "Erreur"); setChargement(false); return; }

      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("RAPPORT DE PRESENCE", 105, 20, { align: "center" });
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Periode : ${MOIS[formPresence.mois - 1]} ${formPresence.annee}`, 105, 28, { align: "center" });
      doc.line(14, 32, 196, 32);

      autoTable(doc, {
        startY: 40,
        head: [["Enseignant", "Matiere", "Jour", "Heure pointage", "Statut"]],
        body: (data.data || []).map((p) => [
          p.enseignant,
          p.matiere,
          p.jour,
          p.heure_pointage_reelle?.slice(0, 8) || "-",
          p.statut,
        ]),
        headStyles: { fillColor: [13, 110, 253], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
      });

      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("Rapport genere par EduSchedule Pro — " + new Date().toLocaleDateString(), 105, 285, { align: "center" });
      doc.save(`rapport_presence_${MOIS[formPresence.mois-1]}_${formPresence.annee}.pdf`);
      setMessage("✅ Rapport de presence genere !");
    } catch (e) {
      setErreur("Erreur lors de la generation");
    }
    setChargement(false);
  };

  const genererRapportAvancement = async () => {
    setChargement(true); setErreur(""); setMessage("");
    try {
      const res = await fetch("/api/vacations.php?action=avancement_programmes", { headers: headersAuth() });
      const data = await res.json();
      if (!data.succes) { setErreur(data.erreur || "Erreur"); setChargement(false); return; }

      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("RAPPORT D AVANCEMENT DES PROGRAMMES", 105, 20, { align: "center" });
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("EduSchedule Pro — ISGE 2025-2026", 105, 28, { align: "center" });
      doc.line(14, 32, 196, 32);

      autoTable(doc, {
        startY: 40,
        head: [["Classe", "Matiere", "Seances realisees", "Avancement moyen"]],
        body: (data.data || []).map((a) => [
          a.classe,
          a.matiere,
          a.nb_seances,
          Math.round(a.avancement_moyen || 0) + "%",
        ]),
        headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
      });

      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("Rapport genere par EduSchedule Pro — " + new Date().toLocaleDateString(), 105, 285, { align: "center" });
      doc.save(`rapport_avancement_programmes.pdf`);
      setMessage("✅ Rapport d avancement genere !");
    } catch (e) {
      setErreur("Erreur lors de la generation");
    }
    setChargement(false);
  };

  const genererRapportVacations = async () => {
    setChargement(true); setErreur(""); setMessage("");
    try {
      const res = await fetch("/api/vacations.php?action=liste", { headers: headersAuth() });
      const data = await res.json();
      if (!data.succes) { setErreur(data.erreur || "Erreur"); setChargement(false); return; }

      const filtrees = (data.data || []).filter(
        (v) => parseInt(v.mois) === parseInt(formVacation.mois) && parseInt(v.annee) === parseInt(formVacation.annee)
      );

      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("RAPPORT DES VACATIONS", 105, 20, { align: "center" });
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Periode : ${MOIS[formVacation.mois - 1]} ${formVacation.annee}`, 105, 28, { align: "center" });
      doc.line(14, 32, 196, 32);

      const totalBrut = filtrees.reduce((acc, v) => acc + parseFloat(v.montant_brut || 0), 0);
      const totalNet  = filtrees.reduce((acc, v) => acc + parseFloat(v.montant_net  || 0), 0);

      doc.setFontSize(10);
      doc.text(`Nombre d enseignants : ${filtrees.length}`, 14, 40);
      doc.text(`Total brut : ${totalBrut.toLocaleString()} FCFA`, 14, 47);
      doc.text(`Total net : ${totalNet.toLocaleString()} FCFA`, 14, 54);

      autoTable(doc, {
        startY: 62,
        head: [["Enseignant", "Matricule", "Seances", "Heures", "Brut (FCFA)", "Net (FCFA)", "Statut"]],
        body: filtrees.map((v) => [
          v.enseignant,
          v.matricule,
          v.nb_seances || 0,
          parseFloat(v.total_heures || 0).toFixed(1) + "h",
          parseFloat(v.montant_brut).toLocaleString(),
          parseFloat(v.montant_net).toLocaleString(),
          v.statut,
        ]),
        headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
      });

      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("Rapport genere par EduSchedule Pro — " + new Date().toLocaleDateString(), 105, 285, { align: "center" });
      doc.save(`rapport_vacations_${MOIS[formVacation.mois-1]}_${formVacation.annee}.pdf`);
      setMessage("✅ Rapport des vacations genere !");
    } catch (e) {
      setErreur("Erreur lors de la generation");
    }
    setChargement(false);
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ fontWeight: 700, fontSize: 24, color: "#0f172a", marginBottom: 4 }}>Rapports</h2>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>Generation de rapports PDF</p>

      {message && <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: 12, marginBottom: 16, color: "#15803d" }}>{message}</div>}
      {erreur  && <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: 12, marginBottom: 16, color: "#dc2626" }}>{erreur}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>

        {/* Rapport présence */}
        <div style={{ background: "white", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
          <h5 style={{ fontWeight: 700, marginBottom: 8 }}>Rapport de Presence</h5>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
            Liste des pointages des enseignants par periode
          </p>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Mois</label>
            <select value={formPresence.mois} onChange={(e) => setFormPresence({ ...formPresence, mois: e.target.value })} style={{ ...inputStyle, width: "100%" }}>
              {MOIS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Annee</label>
            <input type="number" value={formPresence.annee} onChange={(e) => setFormPresence({ ...formPresence, annee: e.target.value })} style={{ ...inputStyle, width: "100%" }} />
          </div>
          <button onClick={genererRapportPresence} disabled={chargement}
            style={{ width: "100%", padding: 10, background: "#0d6efd", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
            {chargement ? "Generation..." : "📥 Generer PDF"}
          </button>
        </div>

        {/* Rapport avancement */}
        <div style={{ background: "white", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📚</div>
          <h5 style={{ fontWeight: 700, marginBottom: 8 }}>Avancement Programmes</h5>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
            Etat d avancement des programmes par matiere et classe
          </p>
          <div style={{ marginBottom: 16, padding: 12, background: "#f8fafc", borderRadius: 8, fontSize: 13, color: "#64748b" }}>
            Ce rapport couvre toute l annee academique en cours.
          </div>
          <button onClick={genererRapportAvancement} disabled={chargement}
            style={{ width: "100%", padding: 10, background: "#8b5cf6", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, marginTop: 16 }}>
            {chargement ? "Generation..." : "📥 Generer PDF"}
          </button>
        </div>

        {/* Rapport vacations */}
        <div style={{ background: "white", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>💰</div>
          <h5 style={{ fontWeight: 700, marginBottom: 8 }}>Rapport des Vacations</h5>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
            Recapitulatif des paiements des enseignants par periode
          </p>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Mois</label>
            <select value={formVacation.mois} onChange={(e) => setFormVacation({ ...formVacation, mois: e.target.value })} style={{ ...inputStyle, width: "100%" }}>
              {MOIS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Annee</label>
            <input type="number" value={formVacation.annee} onChange={(e) => setFormVacation({ ...formVacation, annee: e.target.value })} style={{ ...inputStyle, width: "100%" }} />
          </div>
          <button onClick={genererRapportVacations} disabled={chargement}
            style={{ width: "100%", padding: 10, background: "#f59e0b", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
            {chargement ? "Generation..." : "📥 Generer PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import SignaturePad from "signature_pad";
import VacationPDFPreview from "./VacationPDFPreview";
import * as XLSX from 'xlsx';

const MOIS = ["Janvier","Fevrier","Mars","Avril","Mai","Juin","Juillet","Aout","Septembre","Octobre","Novembre","Decembre"];

const STATUT_CONFIG = {
  generee:            { bg: "#f1f5f9", color: "#475569", label: "⏳ En attente signature enseignant" },
  signee_enseignant:  { bg: "#fef9c3", color: "#a16207", label: "✍️ Signee par enseignant — En attente visa surveillant" },
  visee_surveillant:  { bg: "#dbeafe", color: "#1d4ed8", label: "🔵 Visee surveillant — En attente approbation comptable" },
  approuvee:          { bg: "#dcfce7", color: "#15803d", label: "✅ Approuvee — Pret pour paiement" },
  payee:              { bg: "#f0fdf4", color: "#166534", label: "💰 Payee" },
};

const ETAPES = [
  { label: "1. Signature enseignant" },
  { label: "2. Visa surveillant" },
  { label: "3. Approbation comptable" },
  { label: "4. Payee" },
];

function ProgressionWorkflow({ statut }) {
  const index = Object.keys(STATUT_CONFIG).indexOf(statut);
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 4 }}>
      {ETAPES.map((e, i) => {
        const fait = i < index;
        const encours = i === index;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            <div style={{
              padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: fait ? "#dcfce7" : encours ? "#fef9c3" : "#f1f5f9",
              color: fait ? "#15803d" : encours ? "#a16207" : "#94a3b8",
              border: encours ? "2px solid #fbbf24" : "2px solid transparent",
            }}>
              {fait ? "✅ " : encours ? "👉 " : ""}{e.label}
            </div>
            {i < ETAPES.length - 1 && <div style={{ width: 20, height: 2, background: fait ? "#86efac" : "#e2e8f0" }} />}
          </div>
        );
      })}
    </div>
  );
}

function SignatureModal({ titre, onSigner, onFermer }) {
  const canvasRef = useRef(null);
  const padRef    = useRef(null);

  useEffect(() => {
    if (canvasRef.current)
      padRef.current = new SignaturePad(canvasRef.current, { backgroundColor: "rgb(255,255,255)" });
  }, []);

  const valider = () => {
    if (padRef.current?.isEmpty()) { alert("Veuillez signer avant de valider."); return; }
    onSigner(padRef.current.toDataURL("image/png"));
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: 12, padding: 24, width: 480, boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
        <h5 style={{ fontWeight: 700, marginBottom: 16 }}>{titre}</h5>
        <div style={{ border: "2px dashed #cbd5e1", borderRadius: 8, marginBottom: 12 }}>
          <canvas ref={canvasRef} width={430} height={180} style={{ display: "block", borderRadius: 8 }} />
        </div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16, textAlign: "center" }}>
          Signez dans le cadre avec votre souris ou votre doigt
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => padRef.current?.clear()} style={{ flex: 1, padding: 10, background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Effacer</button>
          <button onClick={valider} style={{ flex: 2, padding: 10, background: "#0d6efd", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>Valider ma signature</button>
          <button onClick={onFermer} style={{ flex: 1, padding: 10, background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Annuler</button>
        </div>
      </div>
    </div>
  );
}

export default function VacationPage() {
  const { headersAuth, utilisateur } = useAuth();
  const [vacations, setVacations]         = useState([]);
  const [enseignants, setEnseignants]     = useState([]);
  const [detail, setDetail]               = useState(null);
  const [chargement, setChargement]       = useState(false);
  const [message, setMessage]             = useState("");
  const [erreur, setErreur]               = useState("");
  const [showForm, setShowForm]           = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [actionSignature, setActionSignature] = useState(null);
  const [showPDF, setShowPDF]             = useState(false);
  const [form, setForm] = useState({
    id_enseignant: "", mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear(), retenues: 0,
  });

  const role = utilisateur?.role;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    chargerVacations();
    if (["administrateur","surveillant","comptable"].includes(role)) {
      fetch("/api/vacations.php?action=enseignants", { headers: headersAuth() })
        .then((r) => r.json()).then((d) => setEnseignants(d.data || []));
    }
  }, []);

  const chargerVacations = () => {
    setChargement(true);
    fetch("/api/vacations.php?action=liste", { headers: headersAuth() })
      .then((r) => r.json())
      .then((d) => { setVacations(d.data || []); setChargement(false); });
  };

  const genererVacation = async () => {
    if (!form.id_enseignant) { setErreur("Selectionnez un enseignant"); return; }
    setErreur(""); setMessage("");
    const res = await fetch("/api/vacations.php?action=generer", {
      method: "POST", headers: headersAuth(), body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.succes) {
      let msg = `✅ Fiche generee ! ${data.nb_seances} seances — Net : ${data.montant_net.toLocaleString()} FCFA`;
      if (data.alertes && data.alertes.length > 0) {
        msg += ` — ⚠️ ${data.alertes.length} alerte(s)`;
      }
      setMessage(msg); setShowForm(false); chargerVacations();
    } else { setErreur(data.erreur || "Erreur"); }
  };

  const voirDetail = async (id) => {
    const res = await fetch(`/api/vacations.php?action=detail&id=${id}`, { headers: headersAuth() });
    const data = await res.json();
    if (data.succes) setDetail(data.data);
  };

  const signerEnseignant = async (signature_base64) => {
    setShowSignature(false);
    const res = await fetch("/api/vacations.php?action=signer_enseignant", {
      method: "POST", headers: headersAuth(),
      body: JSON.stringify({ id: detail.id, signature_base64 }),
    });
    const data = await res.json();
    if (data.succes) { setMessage("✅ Fiche signee !"); chargerVacations(); voirDetail(detail.id); }
    else setErreur(data.erreur || "Erreur signature");
  };

  const viserSurveillant = async (visa_base64) => {
    setShowSignature(false);
    const res = await fetch("/api/vacations.php?action=valider", {
      method: "POST", headers: headersAuth(),
      body: JSON.stringify({ id: detail.id, visa_base64 }),
    });
    const data = await res.json();
    if (data.succes) { setMessage("✅ Visa enregistre !"); chargerVacations(); voirDetail(detail.id); }
    else setErreur(data.erreur || "Erreur visa");
  };

  const approuver = async () => {
    if (!window.confirm("Confirmer l'approbation pour paiement ?")) return;
    const res = await fetch("/api/vacations.php?action=approuver", {
      method: "POST", headers: headersAuth(), body: JSON.stringify({ id: detail.id }),
    });
    const data = await res.json();
    if (data.succes) { setMessage("✅ Vacation approuvee !"); chargerVacations(); setDetail(null); }
    else setErreur(data.erreur || "Erreur");
  };

  const payerVacation = async () => {
    if (!window.confirm(`Confirmer le paiement de ${parseFloat(detail.montant_net).toLocaleString()} FCFA ?`)) return;
    const res = await fetch("/api/vacations.php?action=payer", {
      method: "POST", headers: headersAuth(), body: JSON.stringify({ id: detail.id }),
    });
    const data = await res.json();
    if (data.succes) { setMessage("💰 Paiement enregistre !"); chargerVacations(); setDetail(null); }
    else setErreur(data.erreur || "Erreur");
  };

  // ✅ Export Excel — 2 feuilles
  const exporterExcel = () => {
    if (vacations.length === 0) { alert("Aucune vacation à exporter"); return; }

    const recap = vacations.map(v => ({
      "Enseignant":          v.enseignant,
      "Mois":                MOIS[v.mois - 1],
      "Année":               v.annee,
      "Nb Séances":          v.nb_seances || 0,
      "Total Heures":        parseFloat(v.total_heures || 0).toFixed(2),
      "Montant Brut (FCFA)": parseFloat(v.montant_brut || 0),
      "Retenues (FCFA)":     parseFloat(v.retenues || 0),
      "Montant Net (FCFA)":  parseFloat(v.montant_net || 0),
      "Statut":              STATUT_CONFIG[v.statut]?.label?.replace(/[⏳✍️🔵✅💰]/g, '').trim() || v.statut,
      "Date Paiement":       v.date_paiement || "—",
    }));

    const wsRecap = XLSX.utils.json_to_sheet(recap);
    wsRecap['!cols'] = [
      { wch: 28 }, { wch: 12 }, { wch: 8  }, { wch: 12 },
      { wch: 14 }, { wch: 20 }, { wch: 16 }, { wch: 20 },
      { wch: 30 }, { wch: 16 },
    ];

    const parEnseignant = {};
    vacations.forEach(v => {
      if (!parEnseignant[v.enseignant]) parEnseignant[v.enseignant] = { total_heures: 0, montant_net: 0, nb_fiches: 0 };
      parEnseignant[v.enseignant].total_heures += parseFloat(v.total_heures || 0);
      parEnseignant[v.enseignant].montant_net  += parseFloat(v.montant_net || 0);
      parEnseignant[v.enseignant].nb_fiches    += 1;
    });

    const stats = Object.entries(parEnseignant).map(([ens, s]) => ({
      "Enseignant":       ens,
      "Nb Fiches":        s.nb_fiches,
      "Total Heures":     s.total_heures.toFixed(2),
      "Total Net (FCFA)": s.montant_net,
    }));

    const wsStats = XLSX.utils.json_to_sheet(stats);
    wsStats['!cols'] = [{ wch: 28 }, { wch: 10 }, { wch: 14 }, { wch: 18 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsRecap, "Vacations");
    XLSX.utils.book_append_sheet(wb, wsStats, "Stats par enseignant");
    XLSX.writeFile(wb, `Vacations_ISGE_${new Date().getFullYear()}.xlsx`);
  };

  const getBoutonAction = () => {
    if (!detail) return null;
    const s = detail.statut;
    if (s === "generee" && role === "enseignant")
      return <button onClick={() => { setActionSignature("enseignant"); setShowSignature(true); }} style={{ flex: 1, padding: 10, background: "#f59e0b", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>✍️ Signer ma fiche</button>;
    if (s === "generee" && role === "surveillant")
      return <div style={{ flex: 1, padding: 10, background: "#fef9c3", color: "#a16207", borderRadius: 8, fontWeight: 600, fontSize: 13, textAlign: "center" }}>⚠️ En attente signature enseignant</div>;
    if (s === "generee" && role === "comptable")
      return <div style={{ flex: 1, padding: 10, background: "#fef9c3", color: "#a16207", borderRadius: 8, fontWeight: 600, fontSize: 13, textAlign: "center" }}>⚠️ En attente signature enseignant + visa surveillant</div>;
    if (s === "signee_enseignant" && role === "comptable")
      return <div style={{ flex: 1, padding: 10, background: "#fef9c3", color: "#a16207", borderRadius: 8, fontWeight: 600, fontSize: 13, textAlign: "center" }}>⚠️ En attente visa surveillant</div>;
    if (s === "signee_enseignant" && role === "enseignant")
      return <div style={{ flex: 1, padding: 10, background: "#dcfce7", color: "#15803d", borderRadius: 8, fontWeight: 600, fontSize: 13, textAlign: "center" }}>✅ Vous avez signe cette fiche</div>;
    if (s === "signee_enseignant" && (role === "surveillant" || role === "administrateur"))
      return <button onClick={() => { setActionSignature("surveillant"); setShowSignature(true); }} style={{ flex: 1, padding: 10, background: "#0d6efd", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>🔏 Apposer mon visa</button>;
    if (s === "visee_surveillant" && (role === "comptable" || role === "administrateur"))
      return <button onClick={approuver} style={{ flex: 1, padding: 10, background: "#22c55e", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>✅ Approuver pour paiement</button>;
    if (s === "visee_surveillant" && role !== "comptable" && role !== "administrateur")
      return <div style={{ flex: 1, padding: 10, background: "#dbeafe", color: "#1d4ed8", borderRadius: 8, fontWeight: 600, fontSize: 13, textAlign: "center" }}>🔵 En attente approbation comptable</div>;
    if (s === "approuvee" && (role === "comptable" || role === "administrateur"))
      return <button onClick={payerVacation} style={{ flex: 1, padding: 10, background: "#f59e0b", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>💰 Marquer comme payee</button>;
    if (s === "approuvee" && role !== "comptable" && role !== "administrateur")
      return <div style={{ flex: 1, padding: 10, background: "#dcfce7", color: "#15803d", borderRadius: 8, fontWeight: 700, textAlign: "center" }}>💰 En attente de paiement</div>;
    if (s === "payee")
      return <div style={{ flex: 1, padding: 10, background: "#f0fdf4", color: "#166534", borderRadius: 8, fontWeight: 700, textAlign: "center" }}>💰 Paye le {detail.date_paiement}</div>;
    return null;
  };

  const inputStyle = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" };
  const labelStyle = { display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>

      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: 24, color: "#0f172a", marginBottom: 4 }}>Fiches de Vacation</h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>Calcul et validation des paiements enseignants</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {role === "administrateur" && (
            <button onClick={() => { setShowForm(!showForm); setMessage(""); setErreur(""); }}
              style={{ padding: "10px 20px", background: showForm ? "#f1f5f9" : "#0d6efd", color: showForm ? "#475569" : "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
              {showForm ? "Annuler" : "+ Generer une fiche"}
            </button>
          )}
          <button onClick={exporterExcel}
            style={{ padding: "10px 20px", background: "#f0fdf4", color: "#15803d", border: "1px solid #86efac", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
            📊 Export Excel
          </button>
        </div>
      </div>

      {message && <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: 12, marginBottom: 16, color: "#15803d", fontSize: 13 }}>{message}</div>}
      {erreur  && <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: 12, marginBottom: 16, color: "#dc2626", fontSize: 13 }}>{erreur}</div>}

      <div style={{ background: "#f8fafc", borderRadius: 10, padding: 16, marginBottom: 24, border: "1px solid #e2e8f0" }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#374151", marginBottom: 10 }}>📋 Workflow de validation</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 12 }}>
          {[
            { icon: "1️⃣", role: "Admin",       action: "Genere la fiche",  color: "#f1f5f9", textColor: "#475569" },
            { icon: "2️⃣", role: "Enseignant",  action: "Signe la fiche",   color: "#fef9c3", textColor: "#a16207" },
            { icon: "3️⃣", role: "Surveillant", action: "Appose son visa",  color: "#dbeafe", textColor: "#1d4ed8" },
            { icon: "4️⃣", role: "Comptable",   action: "Approuve + Paie",  color: "#dcfce7", textColor: "#15803d" },
          ].map((e, i) => (
            <div key={i} style={{ background: e.color, color: e.textColor, padding: "6px 12px", borderRadius: 8, fontWeight: 600 }}>
              {e.icon} {e.role} → {e.action}
            </div>
          ))}
        </div>
      </div>

      {showForm && role === "administrateur" && (
        <div style={{ background: "white", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 24 }}>
          <h5 style={{ fontWeight: 700, marginBottom: 20 }}>Generer une fiche de vacation</h5>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div>
              <label style={labelStyle}>Enseignant</label>
              <select value={form.id_enseignant} onChange={(e) => setForm({ ...form, id_enseignant: e.target.value })} style={inputStyle}>
                <option value="">-- Choisir --</option>
                {enseignants.map((e) => <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Mois</label>
              <select value={form.mois} onChange={(e) => setForm({ ...form, mois: e.target.value })} style={inputStyle}>
                {MOIS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Annee</label>
              <input type="number" value={form.annee} onChange={(e) => setForm({ ...form, annee: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Retenues (FCFA)</label>
              <input type="number" value={form.retenues} onChange={(e) => setForm({ ...form, retenues: e.target.value })} style={inputStyle} placeholder="0" />
            </div>
          </div>
          <button onClick={genererVacation} style={{ width: "100%", padding: 12, background: "#0d6efd", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
            Generer la fiche
          </button>
        </div>
      )}

      {showSignature && (
        <SignatureModal
          titre={actionSignature === "enseignant" ? "✍️ Signature enseignant" : "🔏 Visa surveillant"}
          onSigner={actionSignature === "enseignant" ? signerEnseignant : viserSurveillant}
          onFermer={() => setShowSignature(false)}
        />
      )}

      {showPDF && detail && <VacationPDFPreview vacation={detail} onFermer={() => setShowPDF(false)} />}

      {detail && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", borderRadius: 12, padding: 24, width: 720, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h5 style={{ fontWeight: 700 }}>Fiche de Vacation</h5>
              <button onClick={() => setDetail(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}>×</button>
            </div>
            <ProgressionWorkflow statut={detail.statut} />
            <div style={{ background: STATUT_CONFIG[detail.statut]?.bg, color: STATUT_CONFIG[detail.statut]?.color, borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontWeight: 600, fontSize: 13 }}>
              {STATUT_CONFIG[detail.statut]?.label}
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{detail.enseignant}</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>Matricule : {detail.matricule} | Grade : {detail.grade}</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>Taux : {parseFloat(detail.taux_horaire).toLocaleString()} FCFA/h</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>Periode : {MOIS[detail.mois - 1]} {detail.annee}</div>
              {detail.date_paiement && <div style={{ fontSize: 13, color: "#166534", fontWeight: 600, marginTop: 4 }}>💰 Paye le : {detail.date_paiement}</div>}
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16, fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f1f5f9" }}>
                  {["Date","Matiere","Classe","Duree","Montant"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: h === "Duree" || h === "Montant" ? "right" : "left", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(detail.lignes || []).map((l, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "8px 12px" }}>{l.semaine_debut} ({l.jour})</td>
                    <td style={{ padding: "8px 12px" }}>{l.matiere}</td>
                    <td style={{ padding: "8px 12px" }}>{l.classe}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right" }}>{l.duree_heures}h</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600 }}>{parseFloat(l.montant).toLocaleString()} FCFA</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "#f0fdf4", fontWeight: 700 }}>
                  <td colSpan={3} style={{ padding: "10px 12px" }}>TOTAL</td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>{parseFloat(detail.total_heures || 0).toFixed(2)}h</td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>{parseFloat(detail.montant_brut).toLocaleString()} FCFA</td>
                </tr>
                {parseFloat(detail.retenues) > 0 && (
                  <tr style={{ background: "#fef2f2" }}>
                    <td colSpan={4} style={{ padding: "8px 12px", color: "#dc2626" }}>Retenues</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", color: "#dc2626", fontWeight: 600 }}>- {parseFloat(detail.retenues).toLocaleString()} FCFA</td>
                  </tr>
                )}
                <tr style={{ background: "#dcfce7", fontWeight: 700 }}>
                  <td colSpan={4} style={{ padding: "10px 12px", color: "#15803d" }}>MONTANT NET A PAYER</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: "#15803d", fontSize: 15 }}>{parseFloat(detail.montant_net).toLocaleString()} FCFA</td>
                </tr>
              </tfoot>
            </table>
            {(detail.validations || []).length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: "#374151" }}>📝 Historique des validations</div>
                {detail.validations.map((val, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", background: "#f8fafc", borderRadius: 6, padding: "8px 12px", marginBottom: 6, fontSize: 12 }}>
                    <span style={{ fontWeight: 600 }}>
                      {val.role_validateur === "enseignant" ? "✍️ Signature enseignant" :
                       val.role_validateur === "surveillant" ? "🔏 Visa surveillant" :
                       val.role_validateur === "comptable" ? "✅ Approbation comptable" : val.role_validateur}
                    </span>
                    <span style={{ color: "#64748b" }}>{val.validateur} — {val.date_validation}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              {getBoutonAction()}
              <button onClick={() => setShowPDF(true)} style={{ flex: 1, padding: 10, background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>📄 Voir PDF</button>
              <button onClick={() => setDetail(null)} style={{ flex: 1, padding: 10, background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {chargement ? (
        <div style={{ textAlign: "center", padding: 60 }}><div className="spinner-border text-primary" /></div>
      ) : vacations.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💰</div>
          <div style={{ color: "#64748b" }}>Aucune fiche de vacation trouvee</div>
        </div>
      ) : (
        vacations.map((v) => {
          const badge = STATUT_CONFIG[v.statut] || STATUT_CONFIG.generee;
          return (
            <div key={v.id} style={{ background: "white", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 12, borderLeft: `4px solid ${badge.color}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", marginBottom: 4 }}>{v.enseignant}</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 2 }}>{MOIS[v.mois - 1]} {v.annee} — {v.nb_seances || 0} seances — {parseFloat(v.total_heures || 0).toFixed(2)}h</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#15803d" }}>Net : {parseFloat(v.montant_net).toLocaleString()} FCFA</div>
                  {v.statut === "payee" && v.date_paiement && <div style={{ fontSize: 12, color: "#166534", marginTop: 2 }}>💰 Paye le : {v.date_paiement}</div>}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ background: badge.bg, color: badge.color, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{badge.label}</span>
                  <button onClick={() => voirDetail(v.id)} style={{ padding: "6px 14px", background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Voir details</button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
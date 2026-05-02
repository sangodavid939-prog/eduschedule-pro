import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const NIVEAUX = ["Licence 1", "Licence 2", "Licence 3", "Master 1", "Master 2", "BTS", "HND"];

export default function ClassesPage() {
  const { headersAuth } = useAuth();
  const [classes, setClasses]       = useState([]);
  const [showForm, setShowForm]     = useState(false);
  const [editClasse, setEditClasse] = useState(null);
  const [message, setMessage]       = useState("");
  const [erreur, setErreur]         = useState("");

  const [form, setForm] = useState({
    code: "", libelle: "", niveau: "Licence 1",
    annee_academique: "2025-2026", effectif: 30,
  });

  useEffect(() => { chargerClasses(); }, []);

  const chargerClasses = () => {
    fetch("/api/emploi_temps.php", { headers: headersAuth() })
      .then((r) => r.json())
      .then((d) => setClasses(d.data || []));
  };

  const soumettreForm = async () => {
    if (!form.code || !form.libelle) { setErreur("Code et libelle requis"); return; }
    setErreur("");

    const action = editClasse ? "modifier_classe" : "creer_classe";
    const body   = editClasse ? { ...form, id: editClasse.id } : form;

    const res = await fetch(`/api/emploi_temps.php?action=${action}`, {
      method: "POST", headers: headersAuth(), body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.succes) {
      setMessage(editClasse ? "Classe modifiee !" : "Classe creee !");
      setShowForm(false);
      setEditClasse(null);
      setForm({ code: "", libelle: "", niveau: "Licence 1", annee_academique: "2025-2026", effectif: 30 });
      chargerClasses();
    } else {
      setErreur(data.erreur || "Erreur");
    }
  };

  const supprimerClasse = async (id) => {
    if (!window.confirm("Supprimer cette classe ?")) return;
    const res = await fetch(`/api/emploi_temps.php?action=supprimer_classe`, {
      method: "POST", headers: headersAuth(), body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data.succes) { setMessage("Classe supprimee !"); chargerClasses(); }
    else setErreur(data.erreur || "Erreur");
  };

  const ouvrirEdit = (c) => {
    setEditClasse(c);
    setForm({ code: c.code, libelle: c.libelle, niveau: c.niveau, annee_academique: c.annee_academique, effectif: c.effectif });
    setShowForm(true);
  };

  const inputStyle = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: 24, color: "#0f172a", marginBottom: 4 }}>Gestion des Classes</h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>Referentiel des classes de l etablissement</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditClasse(null); setForm({ code: "", libelle: "", niveau: "Licence 1", annee_academique: "2025-2026", effectif: 30 }); setMessage(""); setErreur(""); }}
          style={{ padding: "10px 20px", background: showForm ? "#f1f5f9" : "#0d6efd", color: showForm ? "#475569" : "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
        >
          {showForm ? "Annuler" : "+ Nouvelle classe"}
        </button>
      </div>

      {message && <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: 12, marginBottom: 16, color: "#15803d" }}>{message}</div>}
      {erreur  && <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: 12, marginBottom: 16, color: "#dc2626" }}>{erreur}</div>}

      {/* Formulaire */}
      {showForm && (
        <div style={{ background: "white", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 24 }}>
          <h5 style={{ fontWeight: 700, marginBottom: 20 }}>{editClasse ? "Modifier la classe" : "Nouvelle classe"}</h5>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Code</label>
              <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Ex: L1-RST-2526" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Niveau</label>
              <select value={form.niveau} onChange={(e) => setForm({ ...form, niveau: e.target.value })} style={inputStyle}>
                {NIVEAUX.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Libelle</label>
              <input type="text" value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} placeholder="Ex: Licence 1 Informatique" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Annee academique</label>
              <input type="text" value={form.annee_academique} onChange={(e) => setForm({ ...form, annee_academique: e.target.value })} placeholder="2025-2026" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Effectif</label>
              <input type="number" value={form.effectif} onChange={(e) => setForm({ ...form, effectif: e.target.value })} style={inputStyle} />
            </div>
          </div>
          <button onClick={soumettreForm}
            style={{ width: "100%", padding: 12, background: "#0d6efd", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
            {editClasse ? "Enregistrer les modifications" : "Creer la classe"}
          </button>
        </div>
      )}

      {/* Tableau des classes */}
      <div style={{ background: "white", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#374151", borderBottom: "1px solid #e2e8f0" }}>Code</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#374151", borderBottom: "1px solid #e2e8f0" }}>Libelle</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#374151", borderBottom: "1px solid #e2e8f0" }}>Niveau</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#374151", borderBottom: "1px solid #e2e8f0" }}>Annee</th>
              <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 13, fontWeight: 600, color: "#374151", borderBottom: "1px solid #e2e8f0" }}>Effectif</th>
              <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 13, fontWeight: 600, color: "#374151", borderBottom: "1px solid #e2e8f0" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#0d6efd" }}>{c.code}</td>
                <td style={{ padding: "12px 16px", fontSize: 13 }}>{c.libelle}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ background: "#eff6ff", color: "#0d6efd", padding: "2px 8px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{c.niveau}</span>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "#64748b" }}>{c.annee_academique}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, textAlign: "center" }}>{c.effectif}</td>
                <td style={{ padding: "12px 16px", textAlign: "center" }}>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    <button onClick={() => ouvrirEdit(c)}
                      style={{ padding: "4px 12px", background: "#e0f2fe", color: "#0369a1", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                      Modifier
                    </button>
                    <button onClick={() => supprimerClasse(c.id)}
                      style={{ padding: "4px 12px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
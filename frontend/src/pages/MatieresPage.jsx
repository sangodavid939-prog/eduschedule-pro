import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function MatieresPage() {
  const { headersAuth } = useAuth();
  const [matieres, setMatieres]   = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [editMat, setEditMat]     = useState(null);
  const [message, setMessage]     = useState("");
  const [erreur, setErreur]       = useState("");

  const [form, setForm] = useState({
    code: "", libelle: "", volume_horaire_total: 30, coefficient: 1
  });

  useEffect(() => { chargerMatieres(); }, []);

  const chargerMatieres = () => {
    fetch("/api/emploi_temps.php?type=matieres", { headers: headersAuth() })
      .then((r) => r.json())
      .then((d) => setMatieres(d.data || []));
  };

  const soumettreForm = async () => {
    if (!form.code || !form.libelle) { setErreur("Code et libelle requis"); return; }
    setErreur("");
    const action = editMat ? "modifier_matiere" : "creer_matiere";
    const body   = editMat ? { ...form, id: editMat.id } : form;
    const res = await fetch(`/api/emploi_temps.php?action=${action}`, {
      method: "POST", headers: headersAuth(), body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.succes) {
      setMessage(editMat ? "Matiere modifiee !" : "Matiere creee !");
      setShowForm(false);
      setEditMat(null);
      setForm({ code: "", libelle: "", volume_horaire_total: 30, coefficient: 1 });
      chargerMatieres();
    } else {
      setErreur(data.erreur || "Erreur");
    }
  };

  const supprimerMatiere = async (id) => {
    if (!window.confirm("Supprimer cette matiere ?")) return;
    const res = await fetch("/api/emploi_temps.php?action=supprimer_matiere", {
      method: "POST", headers: headersAuth(), body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data.succes) { setMessage("Matiere supprimee !"); chargerMatieres(); }
    else setErreur(data.erreur || "Erreur");
  };

  const ouvrirEdit = (m) => {
    setEditMat(m);
    setForm({ code: m.code, libelle: m.libelle, volume_horaire_total: m.volume_horaire_total, coefficient: m.coefficient });
    setShowForm(true);
  };

  const inputStyle = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: 24, color: "#0f172a", marginBottom: 4 }}>Gestion des Matieres</h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>Referentiel des matieres enseignees</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditMat(null); setForm({ code: "", libelle: "", volume_horaire_total: 30, coefficient: 1 }); setMessage(""); setErreur(""); }}
          style={{ padding: "10px 20px", background: showForm ? "#f1f5f9" : "#0d6efd", color: showForm ? "#475569" : "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
          {showForm ? "Annuler" : "+ Nouvelle matiere"}
        </button>
      </div>

      {message && <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: 12, marginBottom: 16, color: "#15803d" }}>{message}</div>}
      {erreur  && <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: 12, marginBottom: 16, color: "#dc2626" }}>{erreur}</div>}

      {showForm && (
        <div style={{ background: "white", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 24 }}>
          <h5 style={{ fontWeight: 700, marginBottom: 20 }}>{editMat ? "Modifier la matiere" : "Nouvelle matiere"}</h5>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Code</label>
              <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Ex: INF201" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Libelle</label>
              <input type="text" value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} placeholder="Ex: Developpement Web" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Volume horaire total (h)</label>
              <input type="number" value={form.volume_horaire_total} onChange={(e) => setForm({ ...form, volume_horaire_total: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Coefficient</label>
              <input type="number" value={form.coefficient} onChange={(e) => setForm({ ...form, coefficient: e.target.value })} style={inputStyle} />
            </div>
          </div>
          <button onClick={soumettreForm}
            style={{ width: "100%", padding: 12, background: "#0d6efd", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
            {editMat ? "Enregistrer les modifications" : "Creer la matiere"}
          </button>
        </div>
      )}

      <div style={{ background: "white", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Code","Libelle","Volume horaire","Coefficient","Actions"].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#374151", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matieres.map((m) => (
              <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#0d6efd" }}>{m.code}</td>
                <td style={{ padding: "12px 16px", fontSize: 13 }}>{m.libelle}</td>
                <td style={{ padding: "12px 16px", fontSize: 13 }}>{m.volume_horaire_total}h</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ background: "#eff6ff", color: "#0d6efd", padding: "2px 8px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                    Coef. {m.coefficient}
                  </span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => ouvrirEdit(m)}
                      style={{ padding: "4px 12px", background: "#e0f2fe", color: "#0369a1", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                      Modifier
                    </button>
                    <button onClick={() => supprimerMatiere(m.id)}
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
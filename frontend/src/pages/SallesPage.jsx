import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function SallesPage() {
  const { headersAuth } = useAuth();
  const [salles, setSalles]       = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [editSalle, setEditSalle] = useState(null);
  const [message, setMessage]     = useState("");
  const [erreur, setErreur]       = useState("");

  const [form, setForm] = useState({
    code: "", capacite: 30, equipements: "", batiment: "", disponible: 1
  });

  useEffect(() => { chargerSalles(); }, []);

  const chargerSalles = () => {
    fetch("/api/emploi_temps.php?type=toutes_salles", { headers: headersAuth() })
      .then((r) => r.json())
      .then((d) => setSalles(d.data || []));
  };

  const soumettreForm = async () => {
    if (!form.code) { setErreur("Code requis"); return; }
    setErreur("");
    const action = editSalle ? "modifier_salle" : "creer_salle";
    const body   = editSalle ? { ...form, id: editSalle.id } : form;
    const res = await fetch(`/api/emploi_temps.php?action=${action}`, {
      method: "POST", headers: headersAuth(), body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.succes) {
      setMessage(editSalle ? "Salle modifiee !" : "Salle creee !");
      setShowForm(false);
      setEditSalle(null);
      setForm({ code: "", capacite: 30, equipements: "", batiment: "", disponible: 1 });
      chargerSalles();
    } else {
      setErreur(data.erreur || "Erreur");
    }
  };

  const supprimerSalle = async (id) => {
    if (!window.confirm("Supprimer cette salle ?")) return;
    const res = await fetch("/api/emploi_temps.php?action=supprimer_salle", {
      method: "POST", headers: headersAuth(), body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data.succes) { setMessage("Salle supprimee !"); chargerSalles(); }
    else setErreur(data.erreur || "Erreur");
  };

  const ouvrirEdit = (s) => {
    setEditSalle(s);
    setForm({ code: s.code, capacite: s.capacite, equipements: s.equipements || "", batiment: s.batiment || "", disponible: s.disponible });
    setShowForm(true);
  };

  const inputStyle = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: 24, color: "#0f172a", marginBottom: 4 }}>Gestion des Salles</h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>Referentiel des salles disponibles</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditSalle(null); setForm({ code: "", capacite: 30, equipements: "", batiment: "", disponible: 1 }); setMessage(""); setErreur(""); }}
          style={{ padding: "10px 20px", background: showForm ? "#f1f5f9" : "#0d6efd", color: showForm ? "#475569" : "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
          {showForm ? "Annuler" : "+ Nouvelle salle"}
        </button>
      </div>

      {message && <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: 12, marginBottom: 16, color: "#15803d" }}>{message}</div>}
      {erreur  && <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: 12, marginBottom: 16, color: "#dc2626" }}>{erreur}</div>}

      {showForm && (
        <div style={{ background: "white", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 24 }}>
          <h5 style={{ fontWeight: 700, marginBottom: 20 }}>{editSalle ? "Modifier la salle" : "Nouvelle salle"}</h5>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Code</label>
              <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Ex: SALLE-103" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Capacite</label>
              <input type="number" value={form.capacite} onChange={(e) => setForm({ ...form, capacite: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Batiment</label>
              <input type="text" value={form.batiment} onChange={(e) => setForm({ ...form, batiment: e.target.value })} placeholder="Ex: Batiment A" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Disponible</label>
              <select value={form.disponible} onChange={(e) => setForm({ ...form, disponible: e.target.value })} style={inputStyle}>
                <option value={1}>Oui</option>
                <option value={0}>Non</option>
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Equipements</label>
              <input type="text" value={form.equipements} onChange={(e) => setForm({ ...form, equipements: e.target.value })} placeholder="Ex: Videoprojecteur, Climatisation" style={inputStyle} />
            </div>
          </div>
          <button onClick={soumettreForm}
            style={{ width: "100%", padding: 12, background: "#0d6efd", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
            {editSalle ? "Enregistrer les modifications" : "Creer la salle"}
          </button>
        </div>
      )}

      <div style={{ background: "white", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Code","Capacite","Batiment","Equipements","Disponible","Actions"].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#374151", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {salles.map((s) => (
              <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#0d6efd" }}>{s.code}</td>
                <td style={{ padding: "12px 16px", fontSize: 13 }}>{s.capacite} places</td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "#64748b" }}>{s.batiment}</td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{s.equipements}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ background: s.disponible ? "#dcfce7" : "#fee2e2", color: s.disponible ? "#15803d" : "#dc2626", padding: "2px 8px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                    {s.disponible ? "Oui" : "Non"}
                  </span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => ouvrirEdit(s)}
                      style={{ padding: "4px 12px", background: "#e0f2fe", color: "#0369a1", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                      Modifier
                    </button>
                    <button onClick={() => supprimerSalle(s.id)}
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
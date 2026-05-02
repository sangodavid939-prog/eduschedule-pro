import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function PointageManuelPage() {
  const { headersAuth } = useAuth();
  const [creneaux, setCreneaux]       = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [message, setMessage]         = useState("");
  const [erreur, setErreur]           = useState("");
  const [form, setForm] = useState({
    id_creneau: "", id_enseignant: "", motif: ""
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const h = headersAuth();
    // Charger les créneaux du jour
    fetch("/api/emploi_temps.php?action=creneaux_jour", { headers: h })
      .then((r) => r.json())
      .then((d) => setCreneaux(d.data || []));
    // Charger les enseignants
    fetch("/api/vacations.php?action=enseignants", { headers: h })
      .then((r) => r.json())
      .then((d) => setEnseignants(d.data || []));
  }, []);

  const soumettrePointageManuel = async () => {
    if (!form.id_creneau || !form.id_enseignant) {
      setErreur("Selectionnez un creneau et un enseignant");
      return;
    }
    setErreur(""); setMessage("");
    const res = await fetch("/api/pointages.php?action=pointer_manuel", {
      method: "POST",
      headers: headersAuth(),
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.succes) {
      setMessage("✅ Pointage manuel enregistre avec succes !");
      setForm({ id_creneau: "", id_enseignant: "", motif: "" });
    } else {
      setErreur(data.erreur || "Erreur");
    }
  };

  const inputStyle = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" };
  const labelStyle = { display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <h2 style={{ fontWeight: 700, fontSize: 24, color: "#0f172a", marginBottom: 4 }}>
        ✍️ Pointage Manuel
      </h2>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
        Autoriser un pointage manuel pour un enseignant dont la fenetre horaire est depassee
      </p>

      {/* Alerte */}
      <div style={{ background: "#fef9c3", border: "1px solid #fbbf24", borderRadius: 10, padding: 16, marginBottom: 24 }}>
        <div style={{ fontWeight: 700, color: "#a16207", marginBottom: 4 }}>⚠️ Usage exceptionnel uniquement</div>
        <div style={{ fontSize: 13, color: "#a16207" }}>
          Le pointage manuel doit etre utilise uniquement quand l enseignant n a pas pu pointer dans la fenetre horaire prevue. Toute utilisation est enregistree dans les logs.
        </div>
      </div>

      {message && <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: 12, marginBottom: 16, color: "#15803d" }}>{message}</div>}
      {erreur  && <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: 12, marginBottom: 16, color: "#dc2626" }}>{erreur}</div>}

      <div style={{ background: "white", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Creneau concerné</label>
          <select value={form.id_creneau} onChange={(e) => setForm({ ...form, id_creneau: e.target.value })} style={inputStyle}>
            <option value="">-- Selectionner un creneau --</option>
            {creneaux.map((c) => (
              <option key={c.id} value={c.id}>
                {c.matiere} — {c.classe} — {c.jour} {c.heure_debut?.slice(0,5)}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Enseignant</label>
          <select value={form.id_enseignant} onChange={(e) => setForm({ ...form, id_enseignant: e.target.value })} style={inputStyle}>
            <option value="">-- Selectionner un enseignant --</option>
            {enseignants.map((e) => (
              <option key={e.id} value={e.id}>
                {e.prenom} {e.nom} — {e.matricule}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Motif du pointage manuel</label>
          <textarea
            value={form.motif}
            onChange={(e) => setForm({ ...form, motif: e.target.value })}
            placeholder="Ex: Probleme technique avec le QR Code, enseignant arrive en retard..."
            style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
          />
        </div>

        <button onClick={soumettrePointageManuel}
          style={{ width: "100%", padding: 12, background: "#f59e0b", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
          ✍️ Enregistrer le pointage manuel
        </button>
      </div>
    </div>
  );
}
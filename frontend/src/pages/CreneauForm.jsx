import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

export default function CreneauForm({ idClasse, semaineDebut, onSuccess, onCancel }) {
  const { headersAuth } = useAuth();
  const [enseignants, setEnseignants] = useState([]);
  const [matieres, setMatieres]       = useState([]);
  const [salles, setSalles]           = useState([]);
  const [conflits, setConflits]       = useState([]);
  const [erreur, setErreur]           = useState("");
  const [succes, setSucces]           = useState("");

  const [form, setForm] = useState({
    jour:         "lundi",
    heure_debut:  "08:00",
    heure_fin:    "10:00",
    id_matiere:   "",
    id_enseignant:"",
    id_salle:     "",
  });

  useEffect(() => {
    const h = headersAuth();
    fetch("/api/emploi_temps.php?type=enseignants", { headers: h })
      .then((r) => r.json()).then((d) => setEnseignants(d.data || []));
    fetch("/api/emploi_temps.php?type=matieres", { headers: h })
      .then((r) => r.json()).then((d) => setMatieres(d.data || []));
    fetch("/api/emploi_temps.php?type=salles", { headers: h })
      .then((r) => r.json()).then((d) => setSalles(d.data || []));
  }, [headersAuth]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setConflits([]);
    setErreur("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setConflits([]);

    if (!form.id_matiere || !form.id_enseignant || !form.id_salle) {
      setErreur("Veuillez remplir tous les champs");
      return;
    }

    if (form.heure_fin <= form.heure_debut) {
      setErreur("L heure de fin doit etre apres l heure de debut");
      return;
    }

    const res = await fetch("/api/emploi_temps.php", {
      method: "POST",
      headers: headersAuth(),
      body: JSON.stringify({
        id_classe:     idClasse,
        semaine_debut: semaineDebut,
        creneaux:      [form],
      }),
    });

    const data = await res.json();

    if (data.conflits && data.conflits.length > 0) {
      setConflits(data.conflits);
      return;
    }

    if (!data.succes) {
      setErreur(data.erreur || "Erreur lors de la creation");
      return;
    }

    setSucces("Creneau ajoute avec succes !");
    setTimeout(() => { onSuccess && onSuccess(); }, 1000);
  };

  const inputStyle = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    fontSize: 14,
    background: "#f8fafc",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    marginBottom: 4,
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
  };

  const aConflitEnseignant = conflits.some((c) => c.type === "enseignant");
  const aConflitSalle      = conflits.some((c) => c.type === "salle");

  return (
    <div style={{
      background: "white",
      borderRadius: 12,
      padding: 24,
      boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
      maxWidth: 500,
    }}>
      <h5 style={{ fontWeight: 700, marginBottom: 20, color: "#0f172a" }}>
        Ajouter un creneau
      </h5>

      {erreur && (
        <div style={{ background: "#fee2e2", color: "#dc2626", padding: 10, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          ❌ {erreur}
        </div>
      )}

      {succes && (
        <div style={{ background: "#f0fdf4", color: "#15803d", padding: 10, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          ✅ {succes}
        </div>
      )}

      {conflits.length > 0 && (
        <div style={{
          background: "#fff7ed",
          border: "1px solid #f97316",
          borderRadius: 8,
          marginBottom: 16,
          overflow: "hidden",
        }}>
          <div style={{ background: "#f97316", color: "white", padding: "8px 12px", fontWeight: 700, fontSize: 13 }}>
            ⚠️ Conflit(s) detecte(s) — creneau non enregistre
          </div>
          <div style={{ padding: 12 }}>
            {aConflitEnseignant && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: aConflitSalle ? 10 : 0 }}>
                <span style={{ fontSize: 18 }}>👨‍🏫</span>
                <div>
                  <div style={{ fontWeight: 600, color: "#c2410c", fontSize: 13 }}>Enseignant deja occupe</div>
                  <div style={{ color: "#9a3412", fontSize: 12, marginTop: 2 }}>
                    Cet enseignant a deja un cours planifie sur ce jour et cet horaire. Changez l enseignant ou l horaire.
                  </div>
                </div>
              </div>
            )}
            {aConflitSalle && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ fontSize: 18 }}>🏫</span>
                <div>
                  <div style={{ fontWeight: 600, color: "#c2410c", fontSize: 13 }}>Salle deja occupee</div>
                  <div style={{ color: "#9a3412", fontSize: 12, marginTop: 2 }}>
                    Cette salle est deja reservee sur ce jour et cet horaire. Changez la salle ou l horaire.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Jour</label>
            <select name="jour" value={form.jour} onChange={handleChange} style={inputStyle}>
              {JOURS.map((j) => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Matiere</label>
            <select name="id_matiere" value={form.id_matiere} onChange={handleChange} style={inputStyle}>
              <option value="">-- Choisir --</option>
              {matieres.map((m) => <option key={m.id} value={m.id}>{m.libelle}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Heure debut</label>
            <input type="time" name="heure_debut" value={form.heure_debut} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Heure fin</label>
            <input type="time" name="heure_fin" value={form.heure_fin} onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Enseignant</label>
          <select name="id_enseignant" value={form.id_enseignant} onChange={handleChange}
            style={{ ...inputStyle, border: aConflitEnseignant ? "1.5px solid #f97316" : "1px solid #e2e8f0" }}>
            <option value="">-- Choisir --</option>
            {enseignants.map((e) => (
              <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>
            ))}
          </select>
          {aConflitEnseignant && (
            <div style={{ color: "#f97316", fontSize: 11, marginTop: 3 }}>⚠️ Cet enseignant est en conflit</div>
          )}
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Salle</label>
          <select name="id_salle" value={form.id_salle} onChange={handleChange}
            style={{ ...inputStyle, border: aConflitSalle ? "1.5px solid #f97316" : "1px solid #e2e8f0" }}>
            <option value="">-- Choisir --</option>
            {salles.map((s) => (
              <option key={s.id} value={s.id}>{s.code} (capacite: {s.capacite})</option>
            ))}
          </select>
          {aConflitSalle && (
            <div style={{ color: "#f97316", fontSize: 11, marginTop: 3 }}>⚠️ Cette salle est en conflit</div>
          )}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button type="submit"
            style={{ flex: 1, padding: "10px", background: "#0d6efd", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
            Ajouter le creneau
          </button>
          <button type="button" onClick={onCancel}
            style={{ flex: 1, padding: "10px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
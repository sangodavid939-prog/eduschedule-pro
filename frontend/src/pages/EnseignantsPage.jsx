import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function EnseignantsPage() {
  const { headersAuth } = useAuth();
  const [enseignants, setEnseignants] = useState([]);
  const [showForm, setShowForm]       = useState(false);
  const [editEns, setEditEns]         = useState(null);
  const [message, setMessage]         = useState("");
  const [erreur, setErreur]           = useState("");
  const [showMdp, setShowMdp]         = useState(false);

  const [form, setForm] = useState({
    matricule: "", nom: "", prenom: "", email: "",
    telephone: "", specialite: "", statut: "vacataire",
    taux_horaire: 6000, grade: "",
    mot_de_passe: "", confirmer_mot_de_passe: ""
  });

  useEffect(() => { chargerEnseignants(); }, []);

  const chargerEnseignants = () => {
    fetch("/api/emploi_temps.php?type=enseignants", { headers: headersAuth() })
      .then((r) => r.json())
      .then((d) => setEnseignants(d.data || []));
  };

  const soumettreForm = async () => {
    if (!form.nom || !form.prenom || !form.email) {
      setErreur("Nom, prenom et email requis"); return;
    }
    if (!editEns && !form.mot_de_passe) {
      setErreur("Le mot de passe est requis"); return;
    }
    if (form.mot_de_passe && form.mot_de_passe.length < 6) {
      setErreur("Le mot de passe doit contenir au moins 6 caracteres"); return;
    }
    if (form.mot_de_passe && form.mot_de_passe !== form.confirmer_mot_de_passe) {
      setErreur("Les mots de passe ne correspondent pas"); return;
    }

    setErreur("");
    const action = editEns ? "modifier_enseignant" : "creer_enseignant";
    const body   = editEns ? { ...form, id: editEns.id } : form;

    const res = await fetch(`/api/emploi_temps.php?action=${action}`, {
      method: "POST", headers: headersAuth(), body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.succes) {
      setMessage(editEns ? "Enseignant modifie !" : `Enseignant cree ! Compte : ${form.email} / Mot de passe : ${form.mot_de_passe}`);
      setShowForm(false);
      setEditEns(null);
      resetForm();
      chargerEnseignants();
    } else {
      setErreur(data.erreur || "Erreur");
    }
  };

  const resetForm = () => {
    setForm({
      matricule: "", nom: "", prenom: "", email: "",
      telephone: "", specialite: "", statut: "vacataire",
      taux_horaire: 6000, grade: "",
      mot_de_passe: "", confirmer_mot_de_passe: ""
    });
    setShowMdp(false);
  };

  const supprimerEnseignant = async (id) => {
    if (!window.confirm("Supprimer cet enseignant ?")) return;
    const res = await fetch("/api/emploi_temps.php?action=supprimer_enseignant", {
      method: "POST", headers: headersAuth(), body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data.succes) { setMessage("Enseignant supprime !"); chargerEnseignants(); }
    else setErreur(data.erreur || "Erreur");
  };

  const ouvrirEdit = (e) => {
    setEditEns(e);
    setForm({
      matricule: e.matricule, nom: e.nom, prenom: e.prenom, email: e.email,
      telephone: e.telephone || "", specialite: e.specialite || "",
      statut: e.statut, taux_horaire: e.taux_horaire, grade: e.grade || "",
      mot_de_passe: "", confirmer_mot_de_passe: ""
    });
    setShowForm(true);
    setShowMdp(false);
    setMessage("");
    setErreur("");
  };

  const inputStyle = {
    width: "100%", padding: "8px 12px", borderRadius: 8,
    border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box"
  };

  const labelStyle = { display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: 24, color: "#0f172a", marginBottom: 4 }}>Gestion des Enseignants</h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>Referentiel des enseignants de l etablissement</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm); setEditEns(null);
            resetForm(); setMessage(""); setErreur("");
          }}
          style={{
            padding: "10px 20px",
            background: showForm ? "#f1f5f9" : "#0d6efd",
            color: showForm ? "#475569" : "white",
            border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600
          }}>
          {showForm ? "Annuler" : "+ Nouvel enseignant"}
        </button>
      </div>

      {message && (
        <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: 12, marginBottom: 16, color: "#15803d", fontSize: 13 }}>
          ✅ {message}
        </div>
      )}
      {erreur && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: 12, marginBottom: 16, color: "#dc2626", fontSize: 13 }}>
          ❌ {erreur}
        </div>
      )}

      {showForm && (
        <div style={{ background: "white", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 24 }}>
          <h5 style={{ fontWeight: 700, marginBottom: 20 }}>
            {editEns ? "Modifier l enseignant" : "Nouvel enseignant"}
          </h5>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Matricule</label>
              <input type="text" value={form.matricule}
                onChange={(e) => setForm({ ...form, matricule: e.target.value })}
                placeholder="Ex: ENS-007" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Statut</label>
              <select value={form.statut}
                onChange={(e) => setForm({ ...form, statut: e.target.value })} style={inputStyle}>
                <option value="vacataire">Vacataire</option>
                <option value="permanent">Permanent</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Nom</label>
              <input type="text" value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Prenom</label>
              <input type="text" value={form.prenom}
                onChange={(e) => setForm({ ...form, prenom: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Telephone</label>
              <input type="text" value={form.telephone}
                onChange={(e) => setForm({ ...form, telephone: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Specialite</label>
              <input type="text" value={form.specialite}
                onChange={(e) => setForm({ ...form, specialite: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Grade</label>
              <input type="text" value={form.grade}
                onChange={(e) => setForm({ ...form, grade: e.target.value })}
                placeholder="Ex: Maitre-Assistant" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Taux horaire (FCFA)</label>
              <input type="number" value={form.taux_horaire}
                onChange={(e) => setForm({ ...form, taux_horaire: e.target.value })} style={inputStyle} />
            </div>
          </div>

          {/* ✅ Section mot de passe — obligatoire à la création, optionnelle en modification */}
          <div style={{
            background: editEns ? "#fffbeb" : "#f0f9ff",
            border: `1px solid ${editEns ? "#fde68a" : "#bae6fd"}`,
            borderRadius: 10, padding: 16, marginBottom: 16
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: editEns ? "#92400e" : "#0369a1" }}>
                🔐 {editEns ? "Modifier le mot de passe" : "Compte de connexion"}
              </div>
              <button type="button" onClick={() => setShowMdp(!showMdp)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: editEns ? "#92400e" : "#0369a1", fontWeight: 600 }}>
                {showMdp ? "Masquer" : "Afficher"}
              </button>
            </div>

            {editEns && (
              <div style={{ marginBottom: 12, fontSize: 12, color: "#92400e", background: "#fef3c7", borderRadius: 6, padding: "6px 10px" }}>
                ℹ️ Laissez vide pour conserver le mot de passe actuel.
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>{editEns ? "Nouveau mot de passe" : "Mot de passe"}</label>
                <input
                  type={showMdp ? "text" : "password"}
                  value={form.mot_de_passe}
                  onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })}
                  placeholder={editEns ? "Laisser vide = inchange" : "Min. 6 caracteres"}
                  style={{ ...inputStyle, border: form.mot_de_passe && form.mot_de_passe.length < 6 ? "1px solid #f97316" : "1px solid #e2e8f0" }}
                />
                {form.mot_de_passe && form.mot_de_passe.length < 6 && (
                  <div style={{ color: "#f97316", fontSize: 11, marginTop: 3 }}>Minimum 6 caracteres</div>
                )}
              </div>
              <div>
                <label style={labelStyle}>Confirmer mot de passe</label>
                <input
                  type={showMdp ? "text" : "password"}
                  value={form.confirmer_mot_de_passe}
                  onChange={(e) => setForm({ ...form, confirmer_mot_de_passe: e.target.value })}
                  placeholder="Repeter le mot de passe"
                  style={{ ...inputStyle, border: form.confirmer_mot_de_passe && form.confirmer_mot_de_passe !== form.mot_de_passe ? "1px solid #dc2626" : "1px solid #e2e8f0" }}
                />
                {form.confirmer_mot_de_passe && form.confirmer_mot_de_passe !== form.mot_de_passe && (
                  <div style={{ color: "#dc2626", fontSize: 11, marginTop: 3 }}>Les mots de passe ne correspondent pas</div>
                )}
                {form.confirmer_mot_de_passe && form.confirmer_mot_de_passe === form.mot_de_passe && form.mot_de_passe.length >= 6 && (
                  <div style={{ color: "#15803d", fontSize: 11, marginTop: 3 }}>✅ Mots de passe identiques</div>
                )}
              </div>
            </div>

            {!editEns && (
              <div style={{ marginTop: 10, fontSize: 12, color: "#0369a1" }}>
                ℹ️ L enseignant utilisera son email et ce mot de passe pour se connecter.
              </div>
            )}
          </div>

          <button onClick={soumettreForm}
            style={{ width: "100%", padding: 12, background: "#0d6efd", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
            {editEns ? "Enregistrer les modifications" : "Creer l enseignant"}
          </button>
        </div>
      )}

      <div style={{ background: "white", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Matricule","Nom complet","Email","Specialite","Statut","Taux/h","Actions"].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#374151", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {enseignants.map((e) => (
              <tr key={e.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#0d6efd" }}>{e.matricule}</td>
                <td style={{ padding: "12px 16px", fontSize: 13 }}>{e.prenom} {e.nom}</td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{e.email}</td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{e.specialite}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{
                    background: e.statut === "permanent" ? "#dcfce7" : "#fef9c3",
                    color: e.statut === "permanent" ? "#15803d" : "#a16207",
                    padding: "2px 8px", borderRadius: 20, fontSize: 12, fontWeight: 600
                  }}>
                    {e.statut}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600 }}>{parseFloat(e.taux_horaire).toLocaleString()}</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => ouvrirEdit(e)}
                      style={{ padding: "4px 12px", background: "#e0f2fe", color: "#0369a1", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                      Modifier
                    </button>
                    <button onClick={() => supprimerEnseignant(e.id)}
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
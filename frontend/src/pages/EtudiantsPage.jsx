import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function EtudiantsPage() {
  const { headersAuth } = useAuth();
  const [etudiants, setEtudiants] = useState([]);
  const [classes, setClasses]     = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [editEtu, setEditEtu]     = useState(null);
  const [message, setMessage]     = useState("");
  const [erreur, setErreur]       = useState("");
  const [showMdp, setShowMdp]     = useState(false);

  const [form, setForm] = useState({
    matricule: "", nom: "", prenom: "", email: "",
    telephone: "", id_classe: "",
    mot_de_passe: "", confirmer_mot_de_passe: ""
  });

  useEffect(() => { chargerEtudiants(); chargerClasses(); }, []);

  const chargerEtudiants = () => {
    fetch("/api/emploi_temps.php?type=etudiants", { headers: headersAuth() })
      .then((r) => r.json())
      .then((d) => setEtudiants(d.data || []));
  };

  const chargerClasses = () => {
    fetch("/api/emploi_temps.php?type=classes", { headers: headersAuth() })
      .then((r) => r.json())
      .then((d) => setClasses(d.data || []));
  };

  const soumettreForm = async () => {
    if (!form.nom || !form.prenom || !form.email) {
      setErreur("Nom, prénom et email sont requis"); return;
    }
    if (!form.id_classe) {
      setErreur("Veuillez sélectionner une classe"); return;
    }
    if (!editEtu && !form.mot_de_passe) {
      setErreur("Le mot de passe est requis"); return;
    }
    if (form.mot_de_passe && form.mot_de_passe.length < 6) {
      setErreur("Le mot de passe doit contenir au moins 6 caractères"); return;
    }
    if (form.mot_de_passe && form.mot_de_passe !== form.confirmer_mot_de_passe) {
      setErreur("Les mots de passe ne correspondent pas"); return;
    }

    setErreur("");
    const action = editEtu ? "modifier_etudiant" : "creer_etudiant";
    const body   = editEtu ? { ...form, id: editEtu.id } : form;

    const res = await fetch(`/api/emploi_temps.php?action=${action}`, {
      method: "POST", headers: headersAuth(), body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.succes) {
      setMessage(
        editEtu
          ? "Étudiant modifié avec succès !"
          : `Étudiant créé ! Compte : ${form.email} / Mot de passe : ${form.mot_de_passe}`
      );
      setShowForm(false);
      setEditEtu(null);
      resetForm();
      chargerEtudiants();
    } else {
      setErreur(data.erreur || "Erreur lors de l'opération");
    }
  };

  const resetForm = () => {
    setForm({
      matricule: "", nom: "", prenom: "", email: "",
      telephone: "", id_classe: "",
      mot_de_passe: "", confirmer_mot_de_passe: ""
    });
    setShowMdp(false);
  };

  const supprimerEtudiant = async (id) => {
    if (!window.confirm("Supprimer cet étudiant ? Son compte de connexion sera également supprimé.")) return;
    const res = await fetch("/api/emploi_temps.php?action=supprimer_etudiant", {
      method: "POST", headers: headersAuth(), body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data.succes) { setMessage("Étudiant supprimé !"); chargerEtudiants(); }
    else setErreur(data.erreur || "Erreur");
  };

  const ouvrirEdit = (e) => {
    setEditEtu(e);
    setForm({
      matricule: e.matricule || "", nom: e.nom, prenom: e.prenom, email: e.email,
      telephone: e.telephone || "", id_classe: e.id_classe || "",
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
          <h2 style={{ fontWeight: 700, fontSize: 24, color: "#0f172a", marginBottom: 4 }}>Gestion des Étudiants</h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>Référentiel des étudiants de l'établissement</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm); setEditEtu(null);
            resetForm(); setMessage(""); setErreur("");
          }}
          style={{
            padding: "10px 20px",
            background: showForm ? "#f1f5f9" : "#8b5cf6",
            color: showForm ? "#475569" : "white",
            border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600
          }}>
          {showForm ? "Annuler" : "+ Nouvel étudiant"}
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
            {editEtu ? "Modifier l'étudiant" : "Nouvel étudiant"}
          </h5>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Matricule</label>
              <input type="text" value={form.matricule}
                onChange={(e) => setForm({ ...form, matricule: e.target.value })}
                placeholder="Ex: ETU-2025-001" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Classe *</label>
              <select value={form.id_classe}
                onChange={(e) => setForm({ ...form, id_classe: e.target.value })}
                style={{ ...inputStyle, border: !form.id_classe && erreur ? "1px solid #dc2626" : "1px solid #e2e8f0" }}>
                <option value="">-- Sélectionner une classe --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.libelle} — {c.niveau}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Nom *</label>
              <input type="text" value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Prénom *</label>
              <input type="text" value={form.prenom}
                onChange={(e) => setForm({ ...form, prenom: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email *</label>
              <input type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="prenom.nom@isge.bf" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Téléphone</label>
              <input type="text" value={form.telephone}
                onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                placeholder="Ex: 70 00 00 00" style={inputStyle} />
            </div>
          </div>

          <div style={{
            background: editEtu ? "#fffbeb" : "#f5f3ff",
            border: `1px solid ${editEtu ? "#fde68a" : "#ddd6fe"}`,
            borderRadius: 10, padding: 16, marginBottom: 16
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: editEtu ? "#92400e" : "#6d28d9" }}>
                🔐 {editEtu ? "Modifier le mot de passe" : "Compte de connexion"}
              </div>
              <button type="button" onClick={() => setShowMdp(!showMdp)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: editEtu ? "#92400e" : "#6d28d9", fontWeight: 600 }}>
                {showMdp ? "Masquer" : "Afficher"}
              </button>
            </div>

            {editEtu && (
              <div style={{ marginBottom: 12, fontSize: 12, color: "#92400e", background: "#fef3c7", borderRadius: 6, padding: "6px 10px" }}>
                ℹ️ Laissez vide pour conserver le mot de passe actuel.
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>{editEtu ? "Nouveau mot de passe" : "Mot de passe *"}</label>
                <input
                  type={showMdp ? "text" : "password"}
                  value={form.mot_de_passe}
                  onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })}
                  placeholder={editEtu ? "Laisser vide = inchangé" : "Min. 6 caractères"}
                  style={{ ...inputStyle, border: form.mot_de_passe && form.mot_de_passe.length < 6 ? "1px solid #f97316" : "1px solid #e2e8f0" }}
                />
                {form.mot_de_passe && form.mot_de_passe.length < 6 && (
                  <div style={{ color: "#f97316", fontSize: 11, marginTop: 3 }}>Minimum 6 caractères</div>
                )}
              </div>
              <div>
                <label style={labelStyle}>Confirmer mot de passe</label>
                <input
                  type={showMdp ? "text" : "password"}
                  value={form.confirmer_mot_de_passe}
                  onChange={(e) => setForm({ ...form, confirmer_mot_de_passe: e.target.value })}
                  placeholder="Répéter le mot de passe"
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

            {!editEtu && (
              <div style={{ marginTop: 10, fontSize: 12, color: "#6d28d9" }}>
                ℹ️ L'étudiant utilisera son email et ce mot de passe pour se connecter et consulter son emploi du temps.
              </div>
            )}
          </div>

          <button onClick={soumettreForm}
            style={{ width: "100%", padding: 12, background: "#8b5cf6", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
            {editEtu ? "Enregistrer les modifications" : "Créer l'étudiant"}
          </button>
        </div>
      )}

      <div style={{ background: "white", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Matricule", "Nom complet", "Email", "Classe", "Téléphone", "Actions"].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#374151", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {etudiants.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                  Aucun étudiant enregistré
                </td>
              </tr>
            ) : etudiants.map((e) => (
              <tr key={e.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#8b5cf6" }}>
                  {e.matricule || "—"}
                </td>
                <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500 }}>
                  {e.prenom} {e.nom}
                </td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{e.email}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{
                    background: "#f5f3ff", color: "#6d28d9",
                    padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600
                  }}>
                    {e.nom_classe || "—"}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>
                  {e.telephone || "—"}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => ouvrirEdit(e)}
                      style={{ padding: "4px 12px", background: "#e0f2fe", color: "#0369a1", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                      Modifier
                    </button>
                    <button onClick={() => supprimerEtudiant(e.id)}
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
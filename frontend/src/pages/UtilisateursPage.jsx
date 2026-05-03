import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  { value: "delegue",        label: "Délégué",        couleur: "#06b6d4", bg: "#ecfeff" },
  { value: "surveillant",    label: "Surveillant",     couleur: "#f59e0b", bg: "#fffbeb" },
  { value: "comptable",      label: "Comptable",       couleur: "#ef4444", bg: "#fef2f2" },
  { value: "administrateur", label: "Administrateur",  couleur: "#0d6efd", bg: "#eff6ff" },
];

export default function UtilisateursPage() {
  const { headersAuth } = useAuth();
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [showForm, setShowForm]         = useState(false);
  const [editUser, setEditUser]         = useState(null);
  const [message, setMessage]           = useState("");
  const [erreur, setErreur]             = useState("");
  const [showMdp, setShowMdp]           = useState(false);
  const [filtreRole, setFiltreRole]     = useState("");

  const [form, setForm] = useState({
    nom: "", prenom: "", email: "", telephone: "",
    role: "delegue",
    mot_de_passe: "", confirmer_mot_de_passe: ""
  });

  useEffect(() => { chargerUtilisateurs(); }, []);

  const chargerUtilisateurs = () => {
    fetch("/api/auth.php?action=liste_utilisateurs", { headers: headersAuth() })
      .then((r) => r.json())
      .then((d) => setUtilisateurs(d.data || []));
  };

  const soumettreForm = async () => {
    if (!form.nom || !form.prenom || !form.email) {
      setErreur("Nom, prénom et email sont requis"); return;
    }
    if (!editUser && !form.mot_de_passe) {
      setErreur("Le mot de passe est requis"); return;
    }
    if (form.mot_de_passe && form.mot_de_passe.length < 6) {
      setErreur("Le mot de passe doit contenir au moins 6 caractères"); return;
    }
    if (form.mot_de_passe && form.mot_de_passe !== form.confirmer_mot_de_passe) {
      setErreur("Les mots de passe ne correspondent pas"); return;
    }

    setErreur("");
    const action = editUser ? "modifier_utilisateur" : "creer_utilisateur";
    const body   = editUser ? { ...form, id: editUser.id } : form;

    const res = await fetch(`/api/auth.php?action=${action}`, {
      method: "POST", headers: headersAuth(), body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.succes) {
      setMessage(
        editUser
          ? "Utilisateur modifié avec succès !"
          : `Compte créé ! Email : ${form.email} / Mot de passe : ${form.mot_de_passe}`
      );
      setShowForm(false);
      setEditUser(null);
      resetForm();
      chargerUtilisateurs();
    } else {
      setErreur(data.erreur || "Erreur lors de l'opération");
    }
  };

  const resetForm = () => {
    setForm({
      nom: "", prenom: "", email: "", telephone: "",
      role: "delegue",
      mot_de_passe: "", confirmer_mot_de_passe: ""
    });
    setShowMdp(false);
  };

  const supprimerUtilisateur = async (id) => {
    if (!window.confirm("Désactiver ce compte utilisateur ?")) return;
    const res = await fetch("/api/auth.php?action=supprimer_utilisateur", {
      method: "POST", headers: headersAuth(), body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data.succes) { setMessage("Compte désactivé !"); chargerUtilisateurs(); }
    else setErreur(data.erreur || "Erreur");
  };

  const ouvrirEdit = (u) => {
    setEditUser(u);
    setForm({
      nom: u.nom || "", prenom: u.prenom || "", email: u.email,
      telephone: u.telephone || "", role: u.role,
      mot_de_passe: "", confirmer_mot_de_passe: ""
    });
    setShowForm(true);
    setShowMdp(false);
    setMessage("");
    setErreur("");
  };

  const getRoleConfig = (role) => ROLES.find(r => r.value === role) || ROLES[0];

  const utilisateursFiltres = filtreRole
    ? utilisateurs.filter(u => u.role === filtreRole)
    : utilisateurs;

  const inputStyle = {
    width: "100%", padding: "8px 12px", borderRadius: 8,
    border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box"
  };
  const labelStyle = { display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>

      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: 24, color: "#0f172a", marginBottom: 4 }}>Gestion des Utilisateurs</h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>Délégués, Surveillants, Comptables et Administrateurs</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditUser(null); resetForm(); setMessage(""); setErreur(""); }}
          style={{
            padding: "10px 20px",
            background: showForm ? "#f1f5f9" : "#0d6efd",
            color: showForm ? "#475569" : "white",
            border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600
          }}>
          {showForm ? "Annuler" : "+ Nouvel utilisateur"}
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
            {editUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
          </h5>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Rôle *</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={inputStyle}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Téléphone</label>
              <input type="text" value={form.telephone}
                onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                placeholder="Ex: 70 00 00 00" style={inputStyle} />
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
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Email *</label>
              <input type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="prenom.nom@isge.bf" style={inputStyle} />
            </div>
          </div>

          <div style={{
            background: editUser ? "#fffbeb" : "#f0f9ff",
            border: `1px solid ${editUser ? "#fde68a" : "#bae6fd"}`,
            borderRadius: 10, padding: 16, marginBottom: 16
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: editUser ? "#92400e" : "#0369a1" }}>
                🔐 {editUser ? "Modifier le mot de passe" : "Compte de connexion"}
              </div>
              <button type="button" onClick={() => setShowMdp(!showMdp)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: editUser ? "#92400e" : "#0369a1", fontWeight: 600 }}>
                {showMdp ? "Masquer" : "Afficher"}
              </button>
            </div>

            {editUser && (
              <div style={{ marginBottom: 12, fontSize: 12, color: "#92400e", background: "#fef3c7", borderRadius: 6, padding: "6px 10px" }}>
                ℹ️ Laissez vide pour conserver le mot de passe actuel.
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>{editUser ? "Nouveau mot de passe" : "Mot de passe *"}</label>
                <input
                  type={showMdp ? "text" : "password"}
                  value={form.mot_de_passe}
                  onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })}
                  placeholder={editUser ? "Laisser vide = inchangé" : "Min. 6 caractères"}
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

            {!editUser && (
              <div style={{ marginTop: 10, fontSize: 12, color: "#0369a1" }}>
                ℹ️ L'utilisateur se connectera avec son email et ce mot de passe.
              </div>
            )}
          </div>

          <button onClick={soumettreForm}
            style={{ width: "100%", padding: 12, background: "#0d6efd", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
            {editUser ? "Enregistrer les modifications" : "Créer le compte"}
          </button>
        </div>
      )}

      {/* Filtres par rôle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={() => setFiltreRole("")}
          style={{ padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, background: !filtreRole ? "#0f172a" : "#f1f5f9", color: !filtreRole ? "white" : "#475569" }}>
          Tous ({utilisateurs.length})
        </button>
        {ROLES.map(r => {
          const count = utilisateurs.filter(u => u.role === r.value).length;
          return (
            <button key={r.value} onClick={() => setFiltreRole(r.value)}
              style={{ padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, background: filtreRole === r.value ? r.couleur : r.bg, color: filtreRole === r.value ? "white" : r.couleur }}>
              {r.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Tableau */}
      <div style={{ background: "white", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Nom complet", "Email", "Rôle", "Téléphone", "Statut", "Actions"].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#374151", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {utilisateursFiltres.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                  Aucun utilisateur trouvé
                </td>
              </tr>
            ) : utilisateursFiltres.map((u) => {
              const roleConfig = getRoleConfig(u.role);
              return (
                <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600 }}>
                    {u.nom_affichage || `${u.prenom} ${u.nom}`}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{u.email}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: roleConfig.bg, color: roleConfig.couleur, padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                      {roleConfig.label}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{u.telephone || "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: u.actif ? "#dcfce7" : "#fee2e2", color: u.actif ? "#15803d" : "#dc2626", padding: "2px 8px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                      {u.actif ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => ouvrirEdit(u)}
                        style={{ padding: "4px 12px", background: "#e0f2fe", color: "#0369a1", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                        Modifier
                      </button>
                      <button onClick={() => supprimerUtilisateur(u.id)}
                        style={{ padding: "4px 12px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                        Désactiver
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

export default function CahierPage() {
  const { headersAuth, utilisateur } = useAuth();
  const [cahiers, setCahiers]               = useState([]);
  const [cahierSelectionne, setCahierSelectionne] = useState(null);
  const [showDetail, setShowDetail]         = useState(false);
  const [showSignature, setShowSignature]   = useState(false);
  const [showFormRemplir, setShowFormRemplir] = useState(false);
  const [chargement, setChargement]         = useState(false);
  const [message, setMessage]               = useState("");
  const [erreur, setErreur]                 = useState("");
  const canvasRef                           = useRef(null);
  const [dessin, setDessin]                 = useState(false);

  const [formContenu, setFormContenu] = useState({
    titre_cours: "",
    contenu: [],
    niveau_avancement: "",
    travaux: [],
    heure_fin_reelle: "",
  });
  const [nouveauPoint, setNouveauPoint]     = useState("");
  const [nouveauTravail, setNouveauTravail] = useState({
    description: "", date_limite: "", type: "devoir"
  });

  const role = utilisateur?.role;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { chargerCahiers(); }, []);

  const chargerCahiers = () => {
    setChargement(true);
    fetch("/api/cahiers.php?action=liste", { headers: headersAuth() })
      .then((r) => r.json())
      .then((d) => { setCahiers(d.data || []); setChargement(false); });
  };

  // ✅ Délégué remplit le contenu du cahier
  const soumettreContenu = async () => {
    if (!formContenu.titre_cours) { setErreur("Le titre du cours est requis"); return; }
    setErreur("");
    const res = await fetch("/api/cahiers.php?action=modifier", {
      method: "POST", headers: headersAuth(),
      body: JSON.stringify({
        id:                 cahierSelectionne.id,
        titre_cours:        formContenu.titre_cours,
        contenu_json:       JSON.stringify({ points: formContenu.contenu }),
        niveau_avancement:  formContenu.niveau_avancement,
        travaux:            formContenu.travaux,
      }),
    });
    const data = await res.json();
    if (data.succes) {
      setMessage("Contenu sauvegarde ! Vous pouvez maintenant signer.");
      setShowFormRemplir(false);
      chargerCahiers();
      // Recharger le cahier selectionne
      const res2 = await fetch(`/api/cahiers.php?action=detail&id=${cahierSelectionne.id}`, { headers: headersAuth() });
      const data2 = await res2.json();
      if (data2.succes) setCahierSelectionne(data2.data);
    } else {
      setErreur(data.erreur || "Erreur");
    }
  };

  // ✅ Clôture par l'enseignant (heure de fin + signature)
  const cloturerSeance = async (signature_base64) => {
    if (!formContenu.heure_fin_reelle) {
      setErreur("L heure de fin est requise pour cloture"); return;
    }
    setErreur("");
    const res = await fetch("/api/cahiers.php?action=cloture", {
      method: "POST", headers: headersAuth(),
      body: JSON.stringify({
        id:              cahierSelectionne.id,
        heure_fin:       formContenu.heure_fin_reelle,
        signature_base64,
      }),
    });
    const data = await res.json();
    if (data.succes) {
      setMessage("✅ Seance cloturee ! La vacation peut maintenant etre generee.");
      setShowSignature(false);
      chargerCahiers();
      setShowDetail(false);
    } else {
      setErreur(data.erreur || "Erreur cloture");
    }
  };

  // ✅ Signature délégué
  const signerDelegue = async (signature_base64) => {
    const res = await fetch("/api/cahiers.php?action=signer", {
      method: "POST", headers: headersAuth(),
      body: JSON.stringify({
        id: cahierSelectionne.id,
        signature_base64,
        type: "delegue",
      }),
    });
    const data = await res.json();
    if (data.succes) {
      setMessage("✅ Signature enregistree ! L enseignant peut maintenant cloturer.");
      setShowSignature(false);
      chargerCahiers();
    } else {
      setErreur(data.erreur || "Erreur signature");
    }
  };

  // Gestion canvas signature
  const demarrerDessin = (e) => {
    setDessin(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };
  const dessiner = (e) => {
    if (!dessin) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2; ctx.strokeStyle = "#1e293b";
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };
  const arreterDessin = () => setDessin(false);
  const effacerSignature = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  };

  const validerSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const blank = document.createElement("canvas");
    blank.width = canvas.width; blank.height = canvas.height;
    if (canvas.toDataURL() === blank.toDataURL()) {
      setErreur("Veuillez signer avant de valider"); return;
    }
    const signature = canvas.toDataURL("image/png");
    if (role === "delegue") signerDelegue(signature);
    else if (role === "enseignant") cloturerSeance(signature);
  };

  const ouvrirSignature = (c) => {
    setCahierSelectionne(c);
    setFormContenu({ ...formContenu, heure_fin_reelle: "" });
    setShowSignature(true);
    setErreur("");
  };

  const ouvrirRemplir = (c) => {
    setCahierSelectionne(c);
    setFormContenu({
      titre_cours:        c.titre_cours || "",
      contenu:            c.contenu_json ? (JSON.parse(c.contenu_json)?.points || []) : [],
      niveau_avancement:  c.niveau_avancement || "",
      travaux:            c.travaux || [],
      heure_fin_reelle:   "",
    });
    setShowFormRemplir(true);
    setErreur("");
  };

  const statutBadge = (statut) => {
    if (statut === "cloture")       return { bg: "#dcfce7", color: "#15803d", label: "✅ Cloture" };
    if (statut === "signe_delegue") return { bg: "#dbeafe", color: "#1d4ed8", label: "✍️ Signe delegue" };
    return { bg: "#fef9c3", color: "#a16207", label: "⏳ Brouillon" };
  };

  // Determiner l'action disponible selon role + statut
  const getBoutonAction = (c) => {
    const s = c.statut;

    // DELEGUE : remplit si brouillon, signe si contenu rempli
    if (role === "delegue") {
  // Brouillon : seulement remplir
  if (s === "brouillon")
    return (
      <button onClick={() => ouvrirRemplir(c)}
        style={{ padding: "6px 14px", background: "#f59e0b", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
        📝 Remplir
      </button>
    );

  // En cours : modifier ET signer
  if (s === "en_cours")
    return (
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => ouvrirRemplir(c)}
          style={{ padding: "6px 14px", background: "#f59e0b", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
          ✏️ Modifier
        </button>
        <button onClick={() => ouvrirSignature(c)}
          style={{ padding: "6px 14px", background: "#0d6efd", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
          ✍️ Signer
        </button>
      </div>
    );

  // Déjà signé
  if (s === "signe_delegue")
    return (
      <div style={{ padding: "6px 14px", background: "#dcfce7", color: "#15803d", borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
        ✅ Vous avez signe ce cahier
      </div>
    );
}
    // ENSEIGNANT : clôture si délégué a signé
    if (role === "enseignant") {
      if (s === "brouillon" || s === "en_cours")
        return (
          <div style={{ padding: "6px 14px", background: "#fef9c3", color: "#a16207", borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
            ⚠️ En attente signature delegue
          </div>
        );
      if (s === "signe_delegue")
        return (
          <button onClick={() => ouvrirSignature(c)}
            style={{ padding: "6px 14px", background: "#22c55e", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            🔒 Cloturer la seance
          </button>
        );
    }

    // SURVEILLANT / ADMIN : lecture seule
    if (role === "surveillant" || role === "administrateur") {
      return (
        <span style={{ padding: "6px 14px", background: "#f1f5f9", color: "#64748b", borderRadius: 8, fontSize: 12 }}>
          👁 Lecture seule
        </span>
      );
    }

    return null;
  };

  const inputStyle = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" };
  const labelStyle = { display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>

      {/* En-tête */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontWeight: 700, fontSize: 24, color: "#0f172a", marginBottom: 4 }}>Cahiers de texte</h2>
        <p style={{ color: "#64748b", fontSize: 14 }}>Suivi pedagogique des seances</p>
      </div>

      {/* Guide workflow */}
      <div style={{ background: "#f8fafc", borderRadius: 10, padding: 16, marginBottom: 24, border: "1px solid #e2e8f0" }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#374151", marginBottom: 10 }}>📋 Workflow cahier de texte (ordre obligatoire)</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 12 }}>
          {[
            { icon: "1️⃣", role: "Enseignant", action: "Scanne QR → ouvre cahier", color: "#f1f5f9", textColor: "#475569" },
            { icon: "2️⃣", role: "Delegue",    action: "Remplit + signe",          color: "#fef9c3", textColor: "#a16207" },
            { icon: "3️⃣", role: "Enseignant", action: "Confirme fin + clôture",   color: "#dcfce7", textColor: "#15803d" },
            { icon: "4️⃣", role: "Surveillant",action: "Consulte (lecture seule)", color: "#dbeafe", textColor: "#1d4ed8" },
          ].map((e, i) => (
            <div key={i} style={{ background: e.color, color: e.textColor, padding: "6px 12px", borderRadius: 8, fontWeight: 600 }}>
              {e.icon} {e.role} → {e.action}
            </div>
          ))}
        </div>
      </div>

      {message && <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: 12, marginBottom: 16, color: "#15803d", fontSize: 13 }}>{message}</div>}
      {erreur  && <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: 12, marginBottom: 16, color: "#dc2626", fontSize: 13 }}>{erreur}</div>}

      {/* ✅ Modal : Délégué remplit le contenu */}
      {showFormRemplir && cahierSelectionne && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", borderRadius: 12, padding: 24, width: 680, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h5 style={{ fontWeight: 700 }}>📝 Remplir le cahier de texte</h5>
              <button onClick={() => setShowFormRemplir(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}>×</button>
            </div>

            <div style={{ background: "#f8fafc", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: "#64748b" }}>
              {cahierSelectionne.matiere} — {cahierSelectionne.classe} | {cahierSelectionne.enseignant}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Titre du cours *</label>
              <input type="text" value={formContenu.titre_cours}
                onChange={(e) => setFormContenu({ ...formContenu, titre_cours: e.target.value })}
                placeholder="Ex: Introduction aux algorithmes de tri" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Niveau d avancement</label>
              <input type="text" value={formContenu.niveau_avancement}
                onChange={(e) => setFormContenu({ ...formContenu, niveau_avancement: e.target.value })}
                placeholder="Ex: Chapitre 2/5 — 40%" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Points vus dans le cours</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input type="text" value={nouveauPoint}
                  onChange={(e) => setNouveauPoint(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && nouveauPoint) { setFormContenu({ ...formContenu, contenu: [...formContenu.contenu, nouveauPoint] }); setNouveauPoint(""); }}}
                  placeholder="Ajouter un point et appuyer Entree..." style={{ ...inputStyle, flex: 1 }} />
                <button onClick={() => { if (nouveauPoint) { setFormContenu({ ...formContenu, contenu: [...formContenu.contenu, nouveauPoint] }); setNouveauPoint(""); }}}
                  style={{ padding: "8px 16px", background: "#0d6efd", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>+</button>
              </div>
              {formContenu.contenu.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#f8fafc", borderRadius: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, flex: 1 }}>• {p}</span>
                  <button onClick={() => setFormContenu({ ...formContenu, contenu: formContenu.contenu.filter((_, j) => j !== i) })}
                    style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 16 }}>×</button>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Travaux demandes</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 8, marginBottom: 8 }}>
                <input type="text" value={nouveauTravail.description}
                  onChange={(e) => setNouveauTravail({ ...nouveauTravail, description: e.target.value })}
                  placeholder="Description..." style={inputStyle} />
                <input type="date" value={nouveauTravail.date_limite}
                  onChange={(e) => setNouveauTravail({ ...nouveauTravail, date_limite: e.target.value })}
                  style={{ padding: "8px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }} />
                <select value={nouveauTravail.type}
                  onChange={(e) => setNouveauTravail({ ...nouveauTravail, type: e.target.value })}
                  style={{ padding: "8px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}>
                  <option value="devoir">Devoir</option>
                  <option value="exercice">Exercice</option>
                  <option value="projet">Projet</option>
                </select>
                <button onClick={() => { if (nouveauTravail.description) { setFormContenu({ ...formContenu, travaux: [...formContenu.travaux, nouveauTravail] }); setNouveauTravail({ description: "", date_limite: "", type: "devoir" }); }}}
                  style={{ padding: "8px 12px", background: "#0d6efd", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>+</button>
              </div>
              {formContenu.travaux.map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#f8fafc", borderRadius: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, flex: 1 }}>{t.description} — {t.date_limite} ({t.type})</span>
                  <button onClick={() => setFormContenu({ ...formContenu, travaux: formContenu.travaux.filter((_, j) => j !== i) })}
                    style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 16 }}>×</button>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={soumettreContenu}
                style={{ flex: 2, padding: 12, background: "#0d6efd", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
                💾 Sauvegarder le contenu
              </button>
              <button onClick={() => setShowFormRemplir(false)}
                style={{ flex: 1, padding: 12, background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Modal signature */}
      {showSignature && cahierSelectionne && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", borderRadius: 12, padding: 24, width: 500, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
            <h5 style={{ fontWeight: 700, marginBottom: 8 }}>
              {role === "enseignant" ? "🔒 Clôture de la séance" : "✍️ Signature du délégué"}
            </h5>

            {/* Heure de fin pour l'enseignant */}
            {role === "enseignant" && (
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Heure de fin réelle *</label>
                <input type="time" value={formContenu.heure_fin_reelle}
                  onChange={(e) => setFormContenu({ ...formContenu, heure_fin_reelle: e.target.value })}
                  style={{ ...inputStyle, width: "auto" }} />
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  Heure planifiée : {cahierSelectionne.heure_fin?.slice(0,5)}
                </div>
              </div>
            )}

            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>Signez dans le cadre ci-dessous</p>
            <canvas ref={canvasRef} width={450} height={150}
              style={{ border: "2px dashed #cbd5e1", borderRadius: 8, cursor: "crosshair", display: "block", width: "100%" }}
              onMouseDown={demarrerDessin} onMouseMove={dessiner} onMouseUp={arreterDessin} onMouseLeave={arreterDessin} />

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={effacerSignature}
                style={{ flex: 1, padding: 10, background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
                Effacer
              </button>
              <button onClick={validerSignature}
                style={{ flex: 2, padding: 10, background: role === "enseignant" ? "#22c55e" : "#0d6efd", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
                {role === "enseignant" ? "🔒 Cloturer et signer" : "✍️ Valider ma signature"}
              </button>
              <button onClick={() => setShowSignature(false)}
                style={{ flex: 1, padding: 10, background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des cahiers */}
      {chargement ? (
        <div style={{ textAlign: "center", padding: 60 }}><div className="spinner-border text-primary" /></div>
      ) : cahiers.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ color: "#64748b", fontSize: 14 }}>
            {role === "enseignant" ? "Aucune seance pointee pour le moment." :
             role === "delegue"    ? "Aucun cahier a remplir pour le moment." :
             "Aucun cahier de texte trouve."}
          </div>
        </div>
      ) : (
        cahiers.map((c) => {
          const badge = statutBadge(c.statut);
          return (
            <div key={c.id} style={{ background: "white", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 12, borderLeft: `4px solid ${badge.color}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", marginBottom: 4 }}>
                    {c.titre_cours || <span style={{ color: "#94a3b8", fontStyle: "italic" }}>Sans titre — en attente de saisie</span>}
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 2 }}>{c.matiere} — {c.classe}</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 2 }}>{c.enseignant} | {c.jour} {c.heure_debut?.slice(0,5)} - {c.heure_fin?.slice(0,5)}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>Semaine du {c.semaine_debut}</div>
                  {c.niveau_avancement && (
                    <div style={{ marginTop: 6, fontSize: 12, color: "#0369a1", background: "#f0f9ff", padding: "3px 8px", borderRadius: 6, display: "inline-block" }}>
                      Avancement : {c.niveau_avancement}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ background: badge.bg, color: badge.color, padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                    {badge.label}
                  </span>
                  {getBoutonAction(c)}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
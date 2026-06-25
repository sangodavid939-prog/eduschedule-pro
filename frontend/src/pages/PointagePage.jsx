import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function PointagePage() {
  const { headersAuth, utilisateur } = useAuth();
  const [qrData, setQrData]         = useState(null);
  const [tokenScan, setTokenScan]   = useState("");
  const [erreur, setErreur]         = useState("");
  const [chargement, setChargement] = useState(false);
  const [idCreneau, setIdCreneau]   = useState("");
  const [tokenCopie, setTokenCopie] = useState(false);
  const [ticket, setTicket]         = useState(null);

  const genererQR = async () => {
    if (!idCreneau) { setErreur("Entrez l ID du creneau"); return; }
    setChargement(true); setQrData(null); setErreur("");
    const res  = await fetch(`/api/pointages.php?action=generer_qr&id_creneau=${idCreneau}`, { headers: headersAuth() });
    const data = await res.json();
    setChargement(false);
    if (data.succes) setQrData(data);
    else setErreur(data.erreur || "Erreur lors de la generation");
  };

  const validerPointage = async () => {
    if (!tokenScan.trim()) { setErreur("Entrez le token QR"); return; }
    setErreur(""); setTicket(null);
    const res  = await fetch("/api/pointages.php?action=pointer", {
      method: "POST", headers: headersAuth(),
      body: JSON.stringify({ token_qr: tokenScan.trim() }),
    });
    const data = await res.json();
    if (data.succes) { setTicket(data); setTokenScan(""); }
    else setErreur(data.erreur || "Erreur de pointage");
  };

  const copierToken = () => {
    navigator.clipboard.writeText(qrData.token).then(() => {
      setTokenCopie(true);
      setTimeout(() => setTokenCopie(false), 3000);
    });
  };

  const imprimerTicket = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
      <head>
        <title>Recu de Pointage</title>
        <style>
          body { font-family: Arial, sans-serif; display: flex; justify-content: center; padding: 20px; background: white; }
          .ticket { width: 300px; border: 2px solid #0d6efd; border-radius: 24px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #0d6efd, #3b82f6); padding: 20px; text-align: center; color: white; }
          .header h1 { font-size: 16px; margin: 8px 0 2px; }
          .header p { font-size: 11px; margin: 0; opacity: 0.8; }
          .bande { height: 5px; background: repeating-linear-gradient(90deg, #0d6efd 0px, #0d6efd 8px, #bfdbfe 8px, #bfdbfe 16px); }
          .corps { padding: 16px 20px; }
          .heure-box { text-align: center; background: #eff6ff; border-radius: 10px; padding: 8px; margin-bottom: 16px; }
          .heure-box .date { font-size: 11px; color: #64748b; }
          .heure-box .heure { font-size: 22px; font-weight: 800; color: #0d6efd; font-family: monospace; }
          .ligne { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px dashed #e2e8f0; font-size: 12px; }
          .ligne:last-child { border-bottom: none; }
          .ligne .label { color: #64748b; }
          .ligne .valeur { font-weight: 700; color: #0f172a; }
          .statut { margin-top: 14px; padding: 10px; border-radius: 10px; text-align: center; border: 2px solid ${ticket?.statut === "valide" ? "#0d6efd" : "#f59e0b"}; background: ${ticket?.statut === "valide" ? "#eff6ff" : "#fffbeb"}; }
          .statut p { font-weight: 800; font-size: 13px; color: ${ticket?.statut === "valide" ? "#0d6efd" : "#a16207"}; margin: 0; }
          .footer { padding: 10px 16px; background: #f8fafc; text-align: center; font-size: 10px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <div style="font-size:24px">🎓</div>
            <h1>RECU DE POINTAGE</h1>
            <p>EduSchedule Pro — ISGE</p>
          </div>
          <div class="bande"></div>
          <div class="corps">
            <div class="heure-box">
              <div class="date">${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
              <div class="heure">${ticket?.heure}</div>
            </div>
            <div class="ligne"><span class="label">👤 Enseignant</span><span class="valeur">${utilisateur?.nom || ""}</span></div>
            <div class="ligne"><span class="label">📚 Matiere</span><span class="valeur">${ticket?.seance?.matiere || "—"}</span></div>
            <div class="ligne"><span class="label">🎓 Classe</span><span class="valeur">${ticket?.seance?.classe || "—"}</span></div>
            <div class="ligne"><span class="label">🏛 Salle</span><span class="valeur">${ticket?.seance?.salle || "—"}</span></div>
            <div class="ligne"><span class="label">📅 Jour</span><span class="valeur">${ticket?.seance?.jour || "—"}</span></div>
            <div class="ligne"><span class="label">⏰ Horaire</span><span class="valeur">${ticket?.seance?.heure || "—"}</span></div>
            <div class="statut">
              <p>${ticket?.statut === "valide" ? "✅ PRESENCE VALIDEE" : "⚠️ RETARD SIGNALE"}</p>
              ${ticket?.alerte ? `<p style="font-size:11px;color:#a16207;margin-top:4px">${ticket.alerte}</p>` : ""}
            </div>
          </div>
          <div class="bande"></div>
          <div class="footer">Annee universitaire 2025-2026</div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>

      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontWeight: 800, fontSize: 26, color: "#0f172a", marginBottom: 4 }}>Pointage QR Code</h2>
        <p style={{ color: "#64748b", fontSize: 14 }}>
          {utilisateur?.role === "administrateur"
            ? "Generez un QR Code securise pour chaque seance de cours"
            : "Saisissez le token QR pour valider votre presence"}
        </p>
      </div>

      {/* Section Admin */}
      {utilisateur?.role === "administrateur" && (
        <div>
          <div style={{ background: "white", borderRadius: 16, padding: 28, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 24, border: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, background: "#eff6ff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📱</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>Generer un QR Code</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>Token HMAC-SHA256 a usage unique</div>
              </div>
            </div>
            {erreur && <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 14px", marginBottom: 16, color: "#dc2626", fontSize: 13 }}>⚠️ {erreur}</div>}
            <div style={{ display: "flex", gap: 12 }}>
              <input type="number" placeholder="ID du creneau (ex: 310)" value={idCreneau}
                onChange={(e) => setIdCreneau(e.target.value)} onKeyDown={(e) => e.key === "Enter" && genererQR()}
                style={{ flex: 1, padding: "12px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none" }}
                onFocus={(e) => e.target.style.border = "1.5px solid #0d6efd"}
                onBlur={(e) => e.target.style.border = "1.5px solid #e2e8f0"} />
              <button onClick={genererQR} disabled={chargement}
                style={{ padding: "12px 28px", background: chargement ? "#94a3b8" : "#0d6efd", color: "white", border: "none", borderRadius: 10, cursor: chargement ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 14 }}>
                {chargement ? "⏳ Generation..." : "📱 Generer QR"}
              </button>
            </div>
          </div>

          {qrData && (
            <div style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0" }}>
              <div style={{ background: "linear-gradient(135deg, #15803d, #22c55e)", padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, background: "rgba(255,255,255,0.2)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✅</div>
                <div>
                  <div style={{ fontWeight: 700, color: "white", fontSize: 15 }}>QR Code genere avec succes !</div>
                  <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>Token valide — usage unique securise</div>
                </div>
              </div>
              <div style={{ padding: 24 }}>
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ padding: 12, background: "white", borderRadius: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", border: "1px solid #f1f5f9" }}>
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrData.url_pointage)}`} alt="QR Code" style={{ width: 180, height: 180, display: "block" }} />
                    </div>
                    <div style={{ marginTop: 10, fontSize: 11, color: "#64748b", textAlign: "center" }}>📷 Scanner avec smartphone</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", marginBottom: 16 }}>Informations de la seance</div>
                    {[
                      { label: "📚 Matiere",    value: qrData.seance?.matiere },
                      { label: "🎓 Classe",     value: qrData.seance?.classe },
                      { label: "👤 Enseignant", value: qrData.seance?.enseignant },
                      { label: "🏛 Salle",      value: qrData.seance?.salle },
                      { label: "⏰ Horaire",    value: qrData.seance?.heure },
                      { label: "📅 Date",       value: qrData.seance?.date },
                    ].map((item) => (
                      <div key={item.label} style={{ display: "flex", gap: 8, marginBottom: 10, fontSize: 13 }}>
                        <span style={{ color: "#64748b", minWidth: 110 }}>{item.label} :</span>
                        <span style={{ fontWeight: 600, color: "#0f172a" }}>{item.value}</span>
                      </div>
                    ))}
                    <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#dc2626", fontWeight: 600, marginTop: 4 }}>
                      ⏱ Expire le : {qrData.expire}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 20, background: "#f8fafc", borderRadius: 10, padding: 16, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>🔑 Token de pointage :</div>
                  <div style={{ fontSize: 12, wordBreak: "break-all", fontFamily: "monospace", color: "#0369a1", background: "white", padding: "10px 12px", borderRadius: 8, border: "1px solid #bae6fd", marginBottom: 10 }}>
                    {qrData.token}
                  </div>
                  <button onClick={copierToken}
                    style={{ width: "100%", padding: "10px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, background: tokenCopie ? "#15803d" : "#0d6efd", color: "white" }}>
                    {tokenCopie ? "✅ Token copie dans le presse-papier !" : "📋 Copier le token"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section Enseignant */}
      {utilisateur?.role === "enseignant" && (
        <div>

          {/* Ticket de pointage */}
          {ticket && (
            <div style={{ maxWidth: 320, margin: "0 auto 24px" }}>
              <div style={{ background: "white", borderRadius: 24, overflow: "hidden", boxShadow: "0 8px 32px rgba(13,110,253,0.25)", border: "2px solid #0d6efd" }}>

                <div style={{ background: "linear-gradient(135deg, #0d6efd, #3b82f6)", padding: "20px 16px", textAlign: "center" }}>
                  <div style={{ width: 50, height: 50, background: "rgba(255,255,255,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 10px" }}>🎓</div>
                  <div style={{ fontWeight: 800, color: "white", fontSize: 16 }}>RECU DE POINTAGE</div>
                  <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, marginTop: 2 }}>EduSchedule Pro — ISGE</div>
                </div>

                <div style={{ height: 5, background: "repeating-linear-gradient(90deg, #0d6efd 0px, #0d6efd 8px, #bfdbfe 8px, #bfdbfe 16px)" }} />

                <div style={{ padding: "16px 20px" }}>
                  <div style={{ textAlign: "center", marginBottom: 16, padding: "8px", background: "#eff6ff", borderRadius: 10 }}>
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 22, color: "#0d6efd", fontFamily: "monospace" }}>{ticket.heure}</div>
                  </div>

                  {[
                    { icone: "👤", label: "Enseignant", value: utilisateur?.nom },
                    { icone: "📚", label: "Matiere",    value: ticket.seance?.matiere || "—" },
                    { icone: "🎓", label: "Classe",     value: ticket.seance?.classe  || "—" },
                    { icone: "🏛",  label: "Salle",      value: ticket.seance?.salle   || "—" },
                    { icone: "📅", label: "Jour",       value: ticket.seance?.jour    || "—" },
                    { icone: "⏰", label: "Horaire",    value: ticket.seance?.heure   || "—" },
                  ].map((item, i) => (
                    <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: i < 5 ? "1px dashed #e2e8f0" : "none", fontSize: 13 }}>
                      <span style={{ color: "#64748b" }}>{item.icone} {item.label}</span>
                      <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 12 }}>{item.value}</span>
                    </div>
                  ))}

                  <div style={{ marginTop: 14, padding: "10px", borderRadius: 10, textAlign: "center", background: ticket.statut === "valide" ? "#eff6ff" : "#fffbeb", border: `2px solid ${ticket.statut === "valide" ? "#0d6efd" : "#f59e0b"}` }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: ticket.statut === "valide" ? "#0d6efd" : "#a16207" }}>
                      {ticket.statut === "valide" ? "✅ PRESENCE VALIDEE" : "⚠️ RETARD SIGNALE"}
                    </div>
                    {ticket.alerte && <div style={{ fontSize: 11, color: "#a16207", marginTop: 2 }}>{ticket.alerte}</div>}
                  </div>
                </div>

                <div style={{ height: 5, background: "repeating-linear-gradient(90deg, #0d6efd 0px, #0d6efd 8px, #bfdbfe 8px, #bfdbfe 16px)" }} />

                <div style={{ padding: "12px 16px", background: "#f8fafc", display: "flex", gap: 8 }}>
                  <button onClick={imprimerTicket}
                    style={{ flex: 1, padding: "8px", background: "#0d6efd", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
                    🖨️ Imprimer
                  </button>
                  <button onClick={() => setTicket(null)}
                    style={{ flex: 1, padding: "8px", background: "white", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div style={{ background: "linear-gradient(135deg, #0f172a, #1e3a5f)", borderRadius: 16, padding: 28, color: "white" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📱</div>
              <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 12 }}>Comment pointer ?</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { num: "1", text: "Obtenez le token QR aupres de l administrateur" },
                  { num: "2", text: "Collez le token dans le champ ci-contre" },
                  { num: "3", text: "Cliquez sur Valider ma presence" },
                  { num: "4", text: "Votre ticket de pointage s affiche" },
                ].map((step) => (
                  <div key={step.num} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 28, height: 28, background: "#0d6efd", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                      {step.num}
                    </div>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.5, marginTop: 4 }}>{step.text}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20, background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: 12, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                🔒 Le QR Code est valide ±15 min autour de l heure du cours
              </div>
            </div>

            <div style={{ background: "white", borderRadius: 16, padding: 28, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", border: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <div style={{ width: 40, height: 40, background: "#f0fdf4", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>✅</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>Valider ma presence</div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>Saisissez votre token QR</div>
                </div>
              </div>

              {erreur && (
                <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: "14px 16px", marginBottom: 20, color: "#dc2626", fontSize: 13 }}>
                  ⚠️ {erreur}
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600, color: "#374151" }}>Token QR</label>
                <textarea value={tokenScan} onChange={(e) => setTokenScan(e.target.value)}
                  placeholder="Collez le token QR ici..." rows={5}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, boxSizing: "border-box", resize: "none", outline: "none", fontFamily: "monospace", lineHeight: 1.6 }}
                  onFocus={(e) => e.target.style.border = "1.5px solid #22c55e"}
                  onBlur={(e) => e.target.style.border = "1.5px solid #e2e8f0"} />
              </div>

              <button onClick={validerPointage} disabled={!tokenScan.trim()}
                style={{ width: "100%", padding: "14px", borderRadius: 10, border: "none", cursor: tokenScan.trim() ? "pointer" : "not-allowed", fontWeight: 800, fontSize: 15, background: tokenScan.trim() ? "linear-gradient(135deg, #15803d, #22c55e)" : "#94a3b8", color: "white", boxShadow: tokenScan.trim() ? "0 4px 16px rgba(34,197,94,0.3)" : "none" }}>
                ✅ Valider ma presence
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
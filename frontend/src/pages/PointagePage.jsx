import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function PointagePage() {
  const { headersAuth, utilisateur } = useAuth();
  const [qrData, setQrData]         = useState(null);
  const [tokenScan, setTokenScan]   = useState("");
  const [message, setMessage]       = useState("");
  const [erreur, setErreur]         = useState("");
  const [chargement, setChargement] = useState(false);
  const [idCreneau, setIdCreneau]   = useState("");

  const genererQR = async () => {
    if (!idCreneau) { setErreur("Entrez l ID du creneau"); return; }
    setChargement(true);
    setQrData(null);
    setErreur("");
    const res = await fetch(
      `/api/pointages.php?action=generer_qr&id_creneau=${idCreneau}`,
      { headers: headersAuth() }
    );
    const data = await res.json();
    setChargement(false);
    if (data.succes) {
      setQrData(data);
    } else {
      setErreur(data.erreur || "Erreur lors de la generation");
    }
  };

  const validerPointage = async () => {
    if (!tokenScan) { setErreur("Entrez le token QR"); return; }
    setErreur("");
    setMessage("");
    const res = await fetch("/api/pointages.php?action=pointer", {
      method: "POST",
      headers: headersAuth(),
      body: JSON.stringify({ token_qr: tokenScan }),
    });
    const data = await res.json();
    if (data.succes) {
      setMessage("Pointage enregistre a " + data.heure);
      setTokenScan("");
    } else {
      setErreur(data.erreur || "Erreur de pointage");
    }
  };

  const cardStyle = {
    background: "white", borderRadius: 12, padding: 24,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 24,
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h2 style={{ fontWeight: 700, fontSize: 24, color: "#0f172a", marginBottom: 4 }}>
        Pointage QR Code
      </h2>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
        Generez un QR Code pour chaque seance ou saisissez le token pour pointer
      </p>

      {/* Section Admin */}
      {utilisateur?.role === "administrateur" && (
        <div style={cardStyle}>
          <h5 style={{ fontWeight: 700, marginBottom: 16, color: "#0f172a" }}>
            Generer un QR Code
          </h5>

          {erreur && (
            <div style={{ background: "#fee2e2", borderRadius: 8, padding: 12, marginBottom: 16, color: "#dc2626", fontSize: 13 }}>
              {erreur}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <input
              type="number"
              placeholder="ID du creneau"
              value={idCreneau}
              onChange={(e) => setIdCreneau(e.target.value)}
              style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}
            />
            <button
              onClick={genererQR}
              style={{ padding: "8px 20px", background: "#0d6efd", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
            >
              {chargement ? "Generation..." : "Generer QR"}
            </button>
          </div>

          {qrData && (
            <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, color: "#15803d", marginBottom: 12, fontSize: 15 }}>
                QR Code genere avec succes !
              </div>

              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {/* Image QR Code */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData.url_pointage)}`}
                    alt="QR Code"
                    style={{ borderRadius: 8, border: "4px solid white", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", width: 200, height: 200 }}
                  />
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 8 }}>
                    Scanner pour pointer
                  </div>
                </div>

                {/* Infos seance */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 13, color: "#374151", marginBottom: 8 }}>
                    <strong>Matiere :</strong> {qrData.seance?.matiere}
                  </div>
                  <div style={{ fontSize: 13, color: "#374151", marginBottom: 8 }}>
                    <strong>Classe :</strong> {qrData.seance?.classe}
                  </div>
                  <div style={{ fontSize: 13, color: "#374151", marginBottom: 8 }}>
                    <strong>Enseignant :</strong> {qrData.seance?.enseignant}
                  </div>
                  <div style={{ fontSize: 13, color: "#374151", marginBottom: 8 }}>
                    <strong>Salle :</strong> {qrData.seance?.salle}
                  </div>
                  <div style={{ fontSize: 13, color: "#374151", marginBottom: 8 }}>
                    <strong>Horaire :</strong> {qrData.seance?.heure}
                  </div>
                  <div style={{ fontSize: 13, color: "#dc2626", marginBottom: 12 }}>
                    <strong>Expire le :</strong> {qrData.expire}
                  </div>

                  {/* Token */}
                  <div style={{ background: "#f8fafc", borderRadius: 6, padding: 10 }}>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Token a communiquer :</div>
                    <div style={{ fontSize: 10, wordBreak: "break-all", color: "#0369a1", fontFamily: "monospace" }}>
                      {qrData.token}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section Enseignant */}
      {utilisateur?.role === "enseignant" && (
        <div style={cardStyle}>
          <h5 style={{ fontWeight: 700, marginBottom: 16, color: "#0f172a" }}>
            Pointer ma presence
          </h5>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
            Saisissez le token QR fourni par l administrateur
          </p>

          {message && (
            <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: 12, marginBottom: 16, color: "#15803d", fontWeight: 600 }}>
              {message}
            </div>
          )}
          {erreur && (
            <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: 12, marginBottom: 16, color: "#dc2626" }}>
              {erreur}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>
              Token QR
            </label>
            <textarea
              value={tokenScan}
              onChange={(e) => setTokenScan(e.target.value)}
              placeholder="Collez le token QR ici..."
              rows={4}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, boxSizing: "border-box", resize: "vertical" }}
            />
          </div>
          <button
            onClick={validerPointage}
            style={{ width: "100%", padding: 12, background: "#22c55e", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 15 }}
          >
            Valider mon pointage
          </button>
        </div>
      )}
    </div>
  );
}
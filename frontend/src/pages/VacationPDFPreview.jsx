import { useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const MOIS = ["Janvier","Fevrier","Mars","Avril","Mai","Juin","Juillet","Aout","Septembre","Octobre","Novembre","Decembre"];

export default function VacationPDFPreview({ vacation, onFermer }) {
  const previewRef = useRef(null);

  const genererPDF = () => {
    const doc = new jsPDF();

    // En-tête
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("FICHE DE VACATION", 105, 20, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("EduSchedule Pro — ISGE 2025-2026", 105, 28, { align: "center" });

    // Ligne séparatrice
    doc.setLineWidth(0.5);
    doc.line(14, 32, 196, 32);

    // Infos enseignant
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Informations de l enseignant", 14, 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Nom : ${vacation.enseignant}`, 14, 50);
    doc.text(`Matricule : ${vacation.matricule}`, 14, 57);
    doc.text(`Grade : ${vacation.grade || "Non renseigne"}`, 14, 64);
    doc.text(`Taux horaire : ${parseFloat(vacation.taux_horaire).toLocaleString()} FCFA/h`, 110, 50);
    doc.text(`Periode : ${MOIS[vacation.mois - 1]} ${vacation.annee}`, 110, 57);
    doc.text(`Statut : ${vacation.statut}`, 110, 64);

    // Tableau des séances
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Detail des seances realisees", 14, 76);

    autoTable(doc, {
      startY: 80,
      head: [["Date", "Matiere", "Classe", "Heure debut", "Heure fin", "Duree (h)", "Montant (FCFA)"]],
      body: (vacation.lignes || []).map((l) => [
        l.semaine_debut,
        l.matiere,
        l.classe,
        l.heure_debut?.slice(0, 5),
        l.heure_fin?.slice(0, 5),
        l.duree_heures + "h",
        parseFloat(l.montant).toLocaleString(),
      ]),
      foot: [
        ["", "", "", "", "TOTAL", parseFloat(vacation.total_heures || 0).toFixed(2) + "h",
          parseFloat(vacation.montant_brut).toLocaleString() + " FCFA"],
        ...(parseFloat(vacation.retenues) > 0 ? [
          ["", "", "", "", "Retenues", "", "- " + parseFloat(vacation.retenues).toLocaleString() + " FCFA"]
        ] : []),
        ["", "", "", "", "NET A PAYER", "", parseFloat(vacation.montant_net).toLocaleString() + " FCFA"],
      ],
      headStyles:  { fillColor: [13, 110, 253], textColor: 255, fontStyle: "bold", fontSize: 9 },
      bodyStyles:  { fontSize: 9 },
      footStyles:  { fillColor: [220, 252, 231], textColor: [21, 128, 61], fontStyle: "bold", fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });

    const finalY = doc.lastAutoTable.finalY + 15;

    // Section signatures
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Signatures et validations", 14, finalY);

    const validations = vacation.validations || [];
    const sigEns  = validations.find((v) => v.role_validateur === "enseignant");
    const sigSurv = validations.find((v) => v.role_validateur === "surveillant");
    const sigComp = validations.find((v) => v.role_validateur === "comptable");

    const sigY = finalY + 10;

    // Boites signatures
    doc.setDrawColor(200, 200, 200);
    doc.setFontSize(9);

    // Signature enseignant
    doc.rect(14, sigY, 55, 35);
    doc.setFont("helvetica", "bold");
    doc.text("Signature Enseignant", 41, sigY + 6, { align: "center" });
    if (sigEns) {
      doc.setFont("helvetica", "normal");
      doc.text(sigEns.validateur || "", 41, sigY + 16, { align: "center" });
      doc.text(sigEns.date_validation?.slice(0, 10) || "", 41, sigY + 22, { align: "center" });
      if (sigEns.visa_base64 && sigEns.visa_base64.startsWith("data:image")) {
        try { doc.addImage(sigEns.visa_base64, "PNG", 20, sigY + 10, 43, 20); } catch(e) {}
      }
    }

    // Visa surveillant
    doc.rect(76, sigY, 55, 35);
    doc.setFont("helvetica", "bold");
    doc.text("Visa Surveillant", 103, sigY + 6, { align: "center" });
    if (sigSurv) {
      doc.setFont("helvetica", "normal");
      doc.text(sigSurv.validateur || "", 103, sigY + 16, { align: "center" });
      doc.text(sigSurv.date_validation?.slice(0, 10) || "", 103, sigY + 22, { align: "center" });
      if (sigSurv.visa_base64 && sigSurv.visa_base64.startsWith("data:image")) {
        try { doc.addImage(sigSurv.visa_base64, "PNG", 82, sigY + 10, 43, 20); } catch(e) {}
      }
    }

    // Validation comptable
    doc.rect(138, sigY, 55, 35);
    doc.setFont("helvetica", "bold");
    doc.text("Validation Comptable", 165, sigY + 6, { align: "center" });
    if (sigComp) {
      doc.setFont("helvetica", "normal");
      doc.text(sigComp.validateur || "", 165, sigY + 16, { align: "center" });
      doc.text(sigComp.date_validation?.slice(0, 10) || "", 165, sigY + 22, { align: "center" });
    }

    // Pied de page
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(150);
    doc.text("Document genere par EduSchedule Pro — " + new Date().toLocaleDateString(), 105, 285, { align: "center" });

    doc.save(`vacation_${vacation.enseignant}_${MOIS[vacation.mois-1]}_${vacation.annee}.pdf`);
  };

  if (!vacation) return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: 12, padding: 24, width: 720, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h5 style={{ fontWeight: 700 }}>📄 Apercu — Fiche de Vacation</h5>
          <button onClick={onFermer} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}>×</button>
        </div>

        {/* Apercu */}
        <div ref={previewRef} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 24, background: "#fafafa", marginBottom: 20 }}>

          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#0f172a" }}>FICHE DE VACATION</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>EduSchedule Pro — ISGE 2025-2026</div>
            <div style={{ height: 2, background: "#0d6efd", marginTop: 8 }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20, fontSize: 13 }}>
            <div style={{ background: "white", borderRadius: 8, padding: 12, border: "1px solid #e2e8f0" }}>
              <div style={{ fontWeight: 700, marginBottom: 8, color: "#0d6efd" }}>Enseignant</div>
              <div><strong>Nom :</strong> {vacation.enseignant}</div>
              <div><strong>Matricule :</strong> {vacation.matricule}</div>
              <div><strong>Grade :</strong> {vacation.grade || "Non renseigne"}</div>
            </div>
            <div style={{ background: "white", borderRadius: 8, padding: 12, border: "1px solid #e2e8f0" }}>
              <div style={{ fontWeight: 700, marginBottom: 8, color: "#0d6efd" }}>Periode</div>
              <div><strong>Mois :</strong> {MOIS[vacation.mois - 1]} {vacation.annee}</div>
              <div><strong>Taux :</strong> {parseFloat(vacation.taux_horaire).toLocaleString()} FCFA/h</div>
              <div><strong>Statut :</strong> {vacation.statut}</div>
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 16 }}>
            <thead>
              <tr style={{ background: "#0d6efd", color: "white" }}>
                {["Date","Matiere","Classe","Debut","Fin","Duree","Montant"].map((h) => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(vacation.lignes || []).map((l, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#f8fafc" : "white" }}>
                  <td style={{ padding: "7px 10px" }}>{l.semaine_debut}</td>
                  <td style={{ padding: "7px 10px" }}>{l.matiere}</td>
                  <td style={{ padding: "7px 10px" }}>{l.classe}</td>
                  <td style={{ padding: "7px 10px" }}>{l.heure_debut?.slice(0,5)}</td>
                  <td style={{ padding: "7px 10px" }}>{l.heure_fin?.slice(0,5)}</td>
                  <td style={{ padding: "7px 10px" }}>{l.duree_heures}h</td>
                  <td style={{ padding: "7px 10px", fontWeight: 600 }}>{parseFloat(l.montant).toLocaleString()} FCFA</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: "#f0fdf4", fontWeight: 700 }}>
                <td colSpan={5} style={{ padding: "8px 10px" }}>TOTAL</td>
                <td style={{ padding: "8px 10px" }}>{parseFloat(vacation.total_heures || 0).toFixed(2)}h</td>
                <td style={{ padding: "8px 10px", color: "#15803d" }}>{parseFloat(vacation.montant_brut).toLocaleString()} FCFA</td>
              </tr>
              {parseFloat(vacation.retenues) > 0 && (
                <tr style={{ background: "#fef2f2" }}>
                  <td colSpan={6} style={{ padding: "8px 10px", color: "#dc2626" }}>Retenues</td>
                  <td style={{ padding: "8px 10px", color: "#dc2626", fontWeight: 700 }}>- {parseFloat(vacation.retenues).toLocaleString()} FCFA</td>
                </tr>
              )}
              <tr style={{ background: "#dcfce7", fontWeight: 800 }}>
                <td colSpan={6} style={{ padding: "8px 10px", color: "#15803d" }}>MONTANT NET A PAYER</td>
                <td style={{ padding: "8px 10px", color: "#15803d", fontSize: 14 }}>{parseFloat(vacation.montant_net).toLocaleString()} FCFA</td>
              </tr>
            </tfoot>
          </table>

          {/* Signatures */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 16 }}>
            {[
              { label: "Signature Enseignant", role: "enseignant" },
              { label: "Visa Surveillant",     role: "surveillant" },
              { label: "Validation Comptable", role: "comptable" },
            ].map((s) => {
              const val = (vacation.validations || []).find((v) => v.role_validateur === s.role);
              return (
                <div key={s.role} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 12, minHeight: 80, textAlign: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: 11, color: "#374151", marginBottom: 8 }}>{s.label}</div>
                  {val ? (
                    <>
                      {val.visa_base64 && val.visa_base64.startsWith("data:image") && (
                        <img src={val.visa_base64} alt="signature" style={{ maxWidth: "100%", maxHeight: 50, display: "block", margin: "0 auto 4px" }} />
                      )}
                      <div style={{ fontSize: 10, color: "#64748b" }}>{val.validateur}</div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>{val.date_validation?.slice(0,10)}</div>
                    </>
                  ) : (
                    <div style={{ fontSize: 11, color: "#cbd5e1", marginTop: 16 }}>En attente</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={genererPDF}
            style={{ flex: 2, padding: 12, background: "#0d6efd", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
            📥 Telecharger en PDF
          </button>
          <button onClick={onFermer}
            style={{ flex: 1, padding: 12, background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
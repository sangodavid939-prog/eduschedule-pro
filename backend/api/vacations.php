<?php
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

$db     = (new Database())->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'GET' && $action === 'liste') {
    $user = AuthMiddleware::authentifier();
    $sql = "
        SELECT v.*,
               CONCAT(e.prenom,' ',e.nom) AS enseignant,
               e.matricule, e.taux_horaire,
               COUNT(vl.id)           AS nb_seances,
               SUM(vl.duree_heures)   AS total_heures,
               SUM(vl.montant)        AS total_montant
        FROM vacations v
        JOIN enseignants e   ON v.id_enseignant = e.id
        LEFT JOIN vacation_lignes vl ON vl.id_vacation = v.id
        WHERE 1=1
    ";
    $params = [];
    if ($user['role'] === 'enseignant') {
        $sql .= " AND v.id_enseignant = (SELECT id_lien FROM utilisateurs WHERE id = ?)";
        $params[] = $user['id'];
    }
    $sql .= " GROUP BY v.id ORDER BY v.annee DESC, v.mois DESC";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    echo json_encode(['succes' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

if ($method === 'GET' && $action === 'detail') {
    AuthMiddleware::authentifier();
    $id = (int)($_GET['id'] ?? 0);
    $stmt = $db->prepare("
        SELECT v.*,
               CONCAT(e.prenom,' ',e.nom) AS enseignant,
               e.matricule, e.taux_horaire, e.grade
        FROM vacations v
        JOIN enseignants e ON v.id_enseignant = e.id
        WHERE v.id = ?
    ");
    $stmt->execute([$id]);
    $vacation = $stmt->fetch();
    if (!$vacation) AuthMiddleware::erreur('Vacation introuvable', 404);

    $stmtL = $db->prepare("
        SELECT vl.*,
               c.jour, c.heure_debut, c.heure_fin,
               m.libelle  AS matiere,
               cl.libelle AS classe,
               et.semaine_debut
        FROM vacation_lignes vl
        JOIN creneaux c      ON vl.id_creneau = c.id
        JOIN emploi_temps et ON c.id_emploi_temps = et.id
        JOIN matieres m      ON c.id_matiere = m.id
        JOIN classes cl      ON et.id_classe = cl.id
        WHERE vl.id_vacation = ?
        ORDER BY et.semaine_debut, c.heure_debut
    ");
    $stmtL->execute([$id]);
    $vacation['lignes'] = $stmtL->fetchAll();

    $stmtTotaux = $db->prepare("
        SELECT SUM(duree_heures) AS total_heures,
               SUM(montant)      AS total_montant
        FROM vacation_lignes WHERE id_vacation = ?
    ");
    $stmtTotaux->execute([$id]);
    $totaux = $stmtTotaux->fetch();
    $vacation['total_heures']  = $totaux['total_heures']  ?? 0;
    $vacation['total_montant'] = $totaux['total_montant'] ?? 0;

    $stmtV = $db->prepare("
        SELECT val.*, u.nom_affichage AS validateur
        FROM validations val
        JOIN utilisateurs u ON val.id_validateur = u.id
        WHERE val.id_vacation = ?
        ORDER BY val.date_validation
    ");
    $stmtV->execute([$id]);
    $vacation['validations'] = $stmtV->fetchAll();

    echo json_encode(['succes' => true, 'data' => $vacation]);
    exit;
}

if ($method === 'POST' && $action === 'generer') {
    $user = AuthMiddleware::exigerRole(['administrateur', 'surveillant', 'comptable']);
    $body = json_decode(file_get_contents('php://input'), true);

    $idEnseignant = (int)($body['id_enseignant'] ?? 0);
    $mois         = (int)($body['mois']          ?? date('n'));
    $annee        = (int)($body['annee']         ?? date('Y'));
    $retenues     = (float)($body['retenues']    ?? 0);

    if (!$idEnseignant) AuthMiddleware::erreur('id_enseignant requis', 400);

    $stmtS = $db->prepare("
        SELECT cr.id AS id_creneau,
               ct.heure_fin_reelle,
               p.heure_pointage_reelle,
               ROUND(
                 TIMESTAMPDIFF(MINUTE,
                   CONCAT(et.semaine_debut,' ',cr.heure_debut),
                   CONCAT(et.semaine_debut,' ',COALESCE(ct.heure_fin_reelle, cr.heure_fin))
                 ) / 60, 2
               ) AS duree_heures,
               ROUND(
                 TIMESTAMPDIFF(MINUTE, cr.heure_debut, cr.heure_fin) / 60, 2
               ) AS duree_planifiee,
               e.taux_horaire,
               m.libelle  AS matiere,
               cl.libelle AS classe,
               et.semaine_debut,
               cr.heure_debut, cr.heure_fin
        FROM creneaux cr
        JOIN emploi_temps et  ON cr.id_emploi_temps = et.id
        JOIN classes cl       ON et.id_classe = cl.id
        JOIN matieres m       ON cr.id_matiere = m.id
        JOIN enseignants e    ON cr.id_enseignant = e.id
        JOIN cahiers_texte ct ON ct.id_creneau = cr.id
        JOIN pointages p      ON p.id_creneau = cr.id AND p.statut = 'valide'
        WHERE cr.id_enseignant = ?
          AND MONTH(et.semaine_debut) = ?
          AND YEAR(et.semaine_debut)  = ?
          AND ct.statut = 'cloture'
    ");
    $stmtS->execute([$idEnseignant, $mois, $annee]);
    $seances = $stmtS->fetchAll();

    if (empty($seances)) {
        AuthMiddleware::erreur(
            'Aucune seance valide trouvee. Verifiez que chaque seance a : un pointage QR valide + un cahier de texte cloture.',
            404
        );
    }

    $alertes = [];
    foreach ($seances as $s) {
        $depassement = $s['duree_heures'] - $s['duree_planifiee'];
        if ($depassement > 0.5) {
            $alertes[] = [
                'creneau'     => $s['matiere'] . ' — ' . $s['semaine_debut'],
                'planifie'    => $s['duree_planifiee'] . 'h',
                'declare'     => $s['duree_heures'] . 'h',
                'depassement' => round($depassement * 60) . ' minutes',
            ];
        }
    }

    $stmtNonSigne = $db->prepare("
        SELECT COUNT(*) FROM creneaux cr
        JOIN emploi_temps et  ON cr.id_emploi_temps = et.id
        JOIN cahiers_texte ct ON ct.id_creneau = cr.id
        WHERE cr.id_enseignant = ?
          AND MONTH(et.semaine_debut) = ?
          AND YEAR(et.semaine_debut)  = ?
          AND ct.statut != 'cloture'
    ");
    $stmtNonSigne->execute([$idEnseignant, $mois, $annee]);
    $nbNonClotures = (int)$stmtNonSigne->fetchColumn();

    if ($nbNonClotures > 0) {
        AuthMiddleware::erreur(
            $nbNonClotures . ' seance(s) non cloturee(s). Toutes les seances doivent etre cloturees avant de generer la fiche.',
            400
        );
    }

    $montantBrut = 0;
    foreach ($seances as $s) $montantBrut += $s['duree_heures'] * $s['taux_horaire'];
    $montantNet = $montantBrut - $retenues;

    $db->beginTransaction();
    try {
        $stmtV = $db->prepare("
            INSERT INTO vacations (id_enseignant, mois, annee, montant_brut, retenues, montant_net, statut)
            VALUES (?, ?, ?, ?, ?, ?, 'generee')
            ON DUPLICATE KEY UPDATE
                montant_brut = VALUES(montant_brut),
                retenues     = VALUES(retenues),
                montant_net  = VALUES(montant_net),
                statut       = 'generee'
        ");
        $stmtV->execute([$idEnseignant, $mois, $annee, round($montantBrut,2), round($retenues,2), round($montantNet,2)]);

        $stmtGet = $db->prepare("SELECT id FROM vacations WHERE id_enseignant=? AND mois=? AND annee=?");
        $stmtGet->execute([$idEnseignant, $mois, $annee]);
        $idVacation = (int)$stmtGet->fetchColumn();

        $db->prepare("DELETE FROM vacation_lignes WHERE id_vacation = ?")->execute([$idVacation]);

        $stmtL = $db->prepare("INSERT INTO vacation_lignes (id_vacation, id_creneau, duree_heures, taux, montant) VALUES (?, ?, ?, ?, ?)");
        foreach ($seances as $s) {
            $stmtL->execute([$idVacation, $s['id_creneau'], $s['duree_heures'], $s['taux_horaire'], round($s['duree_heures'] * $s['taux_horaire'], 2)]);
        }

        $db->commit();
        http_response_code(201);
        echo json_encode([
            'succes'       => true,
            'id'           => $idVacation,
            'nb_seances'   => count($seances),
            'montant_brut' => round($montantBrut, 2),
            'retenues'     => round($retenues, 2),
            'montant_net'  => round($montantNet, 2),
            'alertes'      => $alertes,
            'message'      => count($alertes) > 0
                ? 'Fiche generee avec ' . count($alertes) . ' alerte(s) de depassement horaire'
                : 'Fiche de vacation generee avec succes'
        ]);
    } catch (Exception $e) {
        $db->rollBack();
        AuthMiddleware::erreur('Erreur : ' . $e->getMessage(), 500);
    }
    exit;
}

if ($method === 'POST' && $action === 'signer_enseignant') {
    $user = AuthMiddleware::exigerRole(['enseignant']);
    $body = json_decode(file_get_contents('php://input'), true);
    $id   = (int)($body['id'] ?? 0);
    if (!$id) AuthMiddleware::erreur('id vacation requis', 400);

    $stmtCheck = $db->prepare("
        SELECT v.id FROM vacations v
        JOIN enseignants e  ON v.id_enseignant = e.id
        JOIN utilisateurs u ON u.id_lien = e.id AND u.role = 'enseignant'
        WHERE v.id = ? AND u.id = ?
    ");
    $stmtCheck->execute([$id, $user['id']]);
    if (!$stmtCheck->fetch()) AuthMiddleware::erreur('Acces refuse ou vacation introuvable', 403);

    $db->prepare("UPDATE vacations SET statut = 'signee_enseignant' WHERE id = ?")->execute([$id]);
    $db->prepare("
        INSERT INTO validations (id_vacation, id_validateur, role_validateur, visa_base64, commentaire)
        VALUES (?, ?, 'enseignant', ?, ?)
    ")->execute([$id, $user['id'], $body['signature_base64'] ?? '', $body['commentaire'] ?? '']);

    echo json_encode(['succes' => true, 'message' => 'Fiche signee par l enseignant']);
    exit;
}

if ($method === 'POST' && $action === 'valider') {
    $user = AuthMiddleware::exigerRole(['surveillant', 'administrateur']);
    $body = json_decode(file_get_contents('php://input'), true);
    $id   = (int)($body['id'] ?? 0);

    $stmtCheck = $db->prepare("SELECT statut FROM vacations WHERE id = ?");
    $stmtCheck->execute([$id]);
    $vac = $stmtCheck->fetch();
    if (!$vac) AuthMiddleware::erreur('Vacation introuvable', 404);
    if (!in_array($vac['statut'], ['signee_enseignant', 'generee'])) {
        AuthMiddleware::erreur('La vacation doit etre signee par l enseignant d abord', 400);
    }

    $db->prepare("UPDATE vacations SET statut = 'visee_surveillant' WHERE id = ?")->execute([$id]);
    $db->prepare("
        INSERT INTO validations (id_vacation, id_validateur, role_validateur, visa_base64, commentaire)
        VALUES (?, ?, 'surveillant', ?, ?)
    ")->execute([$id, $user['id'], $body['visa_base64'] ?? '', $body['commentaire'] ?? '']);

    echo json_encode(['succes' => true, 'message' => 'Visa surveillant enregistre']);
    exit;
}

if ($method === 'POST' && $action === 'approuver') {
    $user = AuthMiddleware::exigerRole(['comptable', 'administrateur']);
    $body = json_decode(file_get_contents('php://input'), true);
    $id   = (int)($body['id'] ?? 0);

    $stmtCheck = $db->prepare("SELECT statut FROM vacations WHERE id = ?");
    $stmtCheck->execute([$id]);
    $vac = $stmtCheck->fetch();
    if (!$vac) AuthMiddleware::erreur('Vacation introuvable', 404);
    if ($vac['statut'] !== 'visee_surveillant') {
        AuthMiddleware::erreur('Le visa du surveillant est requis avant approbation', 400);
    }

    $db->prepare("UPDATE vacations SET statut = 'approuvee' WHERE id = ?")->execute([$id]);
    $db->prepare("
        INSERT INTO validations (id_vacation, id_validateur, role_validateur, commentaire)
        VALUES (?, ?, 'comptable', ?)
    ")->execute([$id, $user['id'], $body['commentaire'] ?? '']);

    echo json_encode(['succes' => true, 'message' => 'Vacation approuvee pour paiement']);
    exit;
}

if ($method === 'POST' && $action === 'payer') {
    $user = AuthMiddleware::exigerRole(['comptable', 'administrateur']);
    $body = json_decode(file_get_contents('php://input'), true);
    $id   = (int)($body['id'] ?? 0);

    $stmtCheck = $db->prepare("SELECT statut FROM vacations WHERE id = ?");
    $stmtCheck->execute([$id]);
    $vac = $stmtCheck->fetch();
    if (!$vac) AuthMiddleware::erreur('Vacation introuvable', 404);
    if ($vac['statut'] !== 'approuvee') {
        AuthMiddleware::erreur('La vacation doit etre approuvee avant de marquer comme payee', 400);
    }

    $db->prepare("UPDATE vacations SET statut = 'payee', date_paiement = NOW() WHERE id = ?")
       ->execute([$id]);
    $db->prepare("
        INSERT INTO validations (id_vacation, id_validateur, role_validateur, commentaire)
        VALUES (?, ?, 'comptable', 'Paiement effectue')
    ")->execute([$id, $user['id']]);

    echo json_encode(['succes' => true, 'message' => 'Paiement enregistre avec succes !']);
    exit;
}

if ($method === 'GET' && $action === 'enseignants') {
    AuthMiddleware::exigerRole(['administrateur', 'surveillant', 'comptable']);
    $stmt = $db->query("SELECT id, nom, prenom, matricule, taux_horaire, statut FROM enseignants WHERE actif = 1 ORDER BY nom");
    echo json_encode(['succes' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

if ($method === 'GET' && $action === 'stats') {
    AuthMiddleware::exigerRole(['administrateur', 'surveillant']);

    $stmtSJ = $db->query("SELECT COUNT(*) FROM creneaux c JOIN emploi_temps et ON c.id_emploi_temps = et.id WHERE c.statut != 'annule' AND DAYOFWEEK(NOW()) > 1");
    $seancesJour = (int)$stmtSJ->fetchColumn();

    $stmtPres = $db->query("SELECT ROUND(COUNT(p.id) * 100.0 / NULLIF(COUNT(c.id), 0), 1) FROM creneaux c LEFT JOIN pointages p ON p.id_creneau = c.id AND p.statut = 'valide' WHERE c.statut IN ('en_cours', 'termine')");
    $tauxPresence = (float)($stmtPres->fetchColumn() ?? 0);

    $stmtRetard = $db->query("SELECT COUNT(*) FROM pointages WHERE statut = 'retard'");
    $retards = (int)$stmtRetard->fetchColumn();

    $stmtNS = $db->query("SELECT COUNT(*) FROM cahiers_texte WHERE statut != 'cloture'");
    $cahiersNonSignes = (int)$stmtNS->fetchColumn();

    echo json_encode([
        'succes' => true,
        'data'   => [
            'seances_aujourd_hui' => $seancesJour,
            'taux_presence'       => $tauxPresence,
            'retards_aujourd_hui' => $retards,
            'cahiers_non_signes'  => $cahiersNonSignes,
        ]
    ]);
    exit;
}

// ✅ Heures planifiées vs réalisées semaine en cours
if ($method === 'GET' && $action === 'heures_semaine') {
    AuthMiddleware::authentifier();
    $semaine = date('Y-m-d', strtotime('monday this week'));

    $stmt = $db->prepare("
        SELECT cl.libelle AS classe,
               COUNT(cr.id) AS nb_planifiees,
               ROUND(SUM(TIMESTAMPDIFF(MINUTE, cr.heure_debut, cr.heure_fin)) / 60, 1) AS planifiees,
               ROUND(SUM(CASE WHEN cr.statut IN ('termine','en_cours') THEN TIMESTAMPDIFF(MINUTE, cr.heure_debut, cr.heure_fin) ELSE 0 END) / 60, 1) AS realisees
        FROM creneaux cr
        JOIN emploi_temps et ON cr.id_emploi_temps = et.id
        JOIN classes cl ON et.id_classe = cl.id
        WHERE et.semaine_debut = ? AND cr.statut != 'annule'
        GROUP BY cl.id, cl.libelle
        ORDER BY cl.libelle
    ");
    $stmt->execute([$semaine]);
    echo json_encode(['succes' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

// ✅ Avancement des programmes
if ($method === 'GET' && $action === 'avancement_programmes') {
    AuthMiddleware::authentifier();
    $stmt = $db->query("
        SELECT 
            m.libelle AS matiere,
            cl.libelle AS classe,
            COUNT(ct.id) AS nb_seances,
            AVG(CASE 
                WHEN ct.niveau_avancement REGEXP '[0-9]+'
                THEN CAST(REGEXP_SUBSTR(ct.niveau_avancement, '[0-9]+') AS UNSIGNED)
                ELSE 0 
            END) AS avancement_moyen
        FROM cahiers_texte ct
        JOIN creneaux cr      ON ct.id_creneau = cr.id
        JOIN emploi_temps et  ON cr.id_emploi_temps = et.id
        JOIN matieres m       ON cr.id_matiere = m.id
        JOIN classes cl       ON et.id_classe = cl.id
        WHERE ct.statut = 'cloture'
        GROUP BY m.id, cl.id
        ORDER BY cl.libelle, m.libelle
    ");
    echo json_encode(['succes' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

// ✅ Evolution séances par semaine
if ($method === 'GET' && $action === 'seances_par_semaine') {
    AuthMiddleware::authentifier();
    $stmt = $db->query("
        SELECT 
            et.semaine_debut AS semaine,
            COUNT(cr.id) AS planifiees,
            SUM(CASE WHEN cr.statut IN ('en_cours','termine') THEN 1 ELSE 0 END) AS realisees,
            SUM(CASE WHEN cr.statut = 'termine' THEN 1 ELSE 0 END) AS cloturees
        FROM creneaux cr
        JOIN emploi_temps et ON cr.id_emploi_temps = et.id
        WHERE cr.statut != 'annule'
        GROUP BY et.semaine_debut
        ORDER BY et.semaine_debut ASC
        LIMIT 8
    ");
    echo json_encode(['succes' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

AuthMiddleware::erreur('Route non trouvee', 404);
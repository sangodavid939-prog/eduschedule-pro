
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
 
// ─── GET : Générer le QR Code d'un créneau ───────────────────────────────────
if ($method === 'GET' && $action === 'generer_qr') {
    AuthMiddleware::exigerRole(['administrateur']);
    $idCreneau = (int)($_GET['id_creneau'] ?? 0);
    if (!$idCreneau) AuthMiddleware::erreur('id_creneau requis', 400);
 
    $stmt = $db->prepare("
        SELECT c.*, m.libelle AS matiere,
               CONCAT(e.prenom,' ',e.nom) AS enseignant,
               cl.libelle AS classe, s.code AS salle,
               et.semaine_debut
        FROM creneaux c
        JOIN emploi_temps et ON c.id_emploi_temps = et.id
        JOIN matieres m      ON c.id_matiere = m.id
        JOIN enseignants e   ON c.id_enseignant = e.id
        JOIN classes cl      ON et.id_classe = cl.id
        JOIN salles s        ON c.id_salle = s.id
        WHERE c.id = ?
    ");
    $stmt->execute([$idCreneau]);
    $creneau = $stmt->fetch();
    if (!$creneau) AuthMiddleware::erreur('Creneau introuvable', 404);
 
    // Générer token format : id-timestamp-hash12
    $timestamp = time();
    $hash      = substr(hash_hmac('sha256', $idCreneau . '|' . $timestamp, QR_SECRET_KEY), 0, 12);
    $token     = $idCreneau . '-' . $timestamp . '-' . $hash;
 
    // Expiration : 48h après génération (flexible pour les tests et démonstrations)
    $expire = date('Y-m-d H:i:s', time() + 48 * 3600);
 
    $db->prepare("UPDATE creneaux SET qr_token = ?, qr_expire = ?, qr_genere_le = NOW(), qr_utilise = 0 WHERE id = ?")
       ->execute([$token, $expire, $idCreneau]);
 
    $urlPointage = 'http://localhost:3000/pointage?token=' . $token;
 
    echo json_encode([
        'succes'        => true,
        'token'         => $token,
        'url_pointage'  => $urlPointage,
        'expire'        => $expire,
        'seance'        => [
            'matiere'    => $creneau['matiere'],
            'classe'     => $creneau['classe'],
            'enseignant' => $creneau['enseignant'],
            'salle'      => $creneau['salle'],
            'date'       => $creneau['semaine_debut'],
            'heure'      => substr($creneau['heure_debut'],0,5) . ' - ' . substr($creneau['heure_fin'],0,5),
        ]
    ]);
    exit;
}
 
// ─── POST : Valider le scan QR ───────────────────────────────────────────────
if ($method === 'POST' && $action === 'pointer') {
    $user    = AuthMiddleware::exigerRole(['enseignant']);
    $body    = json_decode(file_get_contents('php://input'), true);
    $tokenQR = trim($body['token_qr'] ?? '');
    if (!$tokenQR) AuthMiddleware::erreur('Token QR requis', 400);
 
    // Parser le token : format id-timestamp-hash
    $parts = explode('-', $tokenQR);
    if (count($parts) !== 3) AuthMiddleware::erreur('Format token invalide', 400);
 
    [$idCreneau, $timestamp, $hashRecu] = $parts;
    $hashAttendu = substr(hash_hmac('sha256', $idCreneau . '|' . $timestamp, QR_SECRET_KEY), 0, 12);
 
    if ($hashAttendu !== $hashRecu) {
        AuthMiddleware::erreur('Token QR invalide — signature incorrecte', 401);
    }
 
    // Vérifier que le token existe en base (usage unique)
    $stmt = $db->prepare("SELECT * FROM creneaux WHERE id = ? AND qr_token = ?");
    $stmt->execute([$idCreneau, $tokenQR]);
    $creneau = $stmt->fetch();
 
    if (!$creneau) {
        // Diagnostic précis
        $stmtCheck = $db->prepare("SELECT id, qr_token, qr_utilise FROM creneaux WHERE id = ?");
        $stmtCheck->execute([$idCreneau]);
        $check = $stmtCheck->fetch();
 
        if (!$check) {
            AuthMiddleware::erreur('Creneau introuvable', 404);
        } elseif ($check['qr_utilise'] == 1 || $check['qr_token'] === null) {
            AuthMiddleware::erreur('Ce QR Code a deja ete utilise pour pointer', 400);
        } else {
            AuthMiddleware::erreur('QR Code invalide — regenerez un nouveau QR', 400);
        }
    }
 
    if ((int)($creneau['qr_utilise'] ?? 0) === 1) {
        AuthMiddleware::erreur('Ce QR Code a deja ete utilise', 400);
    }
 
    // Vérifier l'expiration (48h)
    if ($creneau['qr_expire'] && strtotime($creneau['qr_expire']) < time()) {
        AuthMiddleware::erreur('QR Code expire — regenerez un nouveau QR Code', 400);
    }
 
    // Récupérer l'id_enseignant lié au compte
    $stmtE = $db->prepare("SELECT id_lien FROM utilisateurs WHERE id = ?");
    $stmtE->execute([$user['id']]);
    $idEnseignant = $stmtE->fetchColumn();
 
    // Calculer l'écart avec l'heure prévue
    $heureDebut   = strtotime(date('Y-m-d') . ' ' . $creneau['heure_debut']);
    $retardSec    = time() - $heureDebut;
    $statut       = ($retardSec > 1800) ? 'retard' : 'valide';
 
    try {
        $db->prepare("
            INSERT INTO pointages (id_creneau, id_enseignant, heure_pointage_reelle, ip_source, token_utilise, statut)
            VALUES (?, ?, NOW(), ?, ?, ?)
        ")->execute([$idCreneau, $idEnseignant, $_SERVER['REMOTE_ADDR'] ?? '', $tokenQR, $statut]);
 
        // Invalider le token — usage unique
        $db->prepare("UPDATE creneaux SET qr_token = NULL, qr_utilise = 1, statut = 'en_cours' WHERE id = ?")
           ->execute([$idCreneau]);
 
        // Créer le cahier de texte brouillon si inexistant
        $stmtCheck = $db->prepare("SELECT id FROM cahiers_texte WHERE id_creneau = ?");
        $stmtCheck->execute([$idCreneau]);
        if (!$stmtCheck->fetch()) {
            $stmtDelegue = $db->prepare("SELECT id FROM utilisateurs WHERE role = 'delegue' LIMIT 1");
            $stmtDelegue->execute();
            $idDelegue = $stmtDelegue->fetchColumn() ?: 1;
            $db->prepare("
                INSERT INTO cahiers_texte (id_creneau, id_delegue, titre_cours, contenu_json, statut)
                VALUES (?, ?, '', '{}', 'brouillon')
            ")->execute([$idCreneau, $idDelegue]);
        }
 
        // Log de l'activité
        $db->prepare("
            INSERT INTO logs_activite (id_utilisateur, action, details_json, ip)
            VALUES (?, 'scan_qr_succes', ?, ?)
        ")->execute([
            $user['id'],
            json_encode(['id_creneau' => $idCreneau, 'statut' => $statut]),
            $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ]);
 
        $alerte = null;
        if ($retardSec > 1800) {
            $min = round($retardSec / 60);
            $alerte = "Alerte : retard de {$min} minutes signale au surveillant";
        }
 
        echo json_encode([
            'succes'  => true,
            'message' => 'Pointage enregistre avec succes.',
            'statut'  => $statut,
            'alerte'  => $alerte,
            'heure'   => date('H:i:s'),
        ]);
 
    } catch (Exception $e) {
        AuthMiddleware::erreur('Ce creneau a deja ete pointe (doublon)', 409);
    }
    exit;
}
 
// ─── GET : Liste des pointages ────────────────────────────────────────────────
if ($method === 'GET' && $action === 'liste') {
    AuthMiddleware::exigerRole(['administrateur', 'surveillant']);
    $stmt = $db->query("
        SELECT p.*, CONCAT(e.prenom,' ',e.nom) AS enseignant,
               m.libelle AS matiere, c.jour, c.heure_debut
        FROM pointages p
        JOIN enseignants e ON p.id_enseignant = e.id
        JOIN creneaux c    ON p.id_creneau = c.id
        JOIN matieres m    ON c.id_matiere = m.id
        ORDER BY p.heure_pointage_reelle DESC LIMIT 50
    ");
    echo json_encode(['succes' => true, 'data' => $stmt->fetchAll()]);
    exit;
}
 
// ─── GET : Rapport mensuel des pointages ──────────────────────────────────────
if ($method === 'GET' && $action === 'rapport') {
    AuthMiddleware::exigerRole(['administrateur', 'surveillant']);
    $mois  = (int)($_GET['mois']  ?? date('n'));
    $annee = (int)($_GET['annee'] ?? date('Y'));
    $stmt = $db->prepare("
        SELECT p.*, CONCAT(e.prenom,' ',e.nom) AS enseignant,
               m.libelle AS matiere, c.jour, c.heure_debut,
               p.heure_pointage_reelle, p.statut
        FROM pointages p
        JOIN enseignants e ON p.id_enseignant = e.id
        JOIN creneaux c    ON p.id_creneau = c.id
        JOIN matieres m    ON c.id_matiere = m.id
        JOIN emploi_temps et ON c.id_emploi_temps = et.id
        WHERE MONTH(et.semaine_debut) = ? AND YEAR(et.semaine_debut) = ?
        ORDER BY et.semaine_debut, c.heure_debut
    ");
    $stmt->execute([$mois, $annee]);
    echo json_encode(['succes' => true, 'data' => $stmt->fetchAll()]);
    exit;
}
 
// ─── POST : Régénérer le QR d'un créneau (admin) ─────────────────────────────
if ($method === 'POST' && $action === 'regenerer_qr') {
    AuthMiddleware::exigerRole(['administrateur']);
    $body      = json_decode(file_get_contents('php://input'), true);
    $idCreneau = (int)($body['id_creneau'] ?? 0);
    if (!$idCreneau) AuthMiddleware::erreur('id_creneau requis', 400);
 
    // Supprimer l'ancien pointage pour permettre un nouveau scan
    $db->prepare("DELETE FROM pointages WHERE id_creneau = ?")->execute([$idCreneau]);
    $db->prepare("UPDATE creneaux SET statut = 'planifie', qr_token = NULL, qr_utilise = 0 WHERE id = ?")->execute([$idCreneau]);
 
    // Nouveau token
    $timestamp = time();
    $hash      = substr(hash_hmac('sha256', $idCreneau . '|' . $timestamp, QR_SECRET_KEY), 0, 12);
    $token     = $idCreneau . '-' . $timestamp . '-' . $hash;
    $expire    = date('Y-m-d H:i:s', time() + 48 * 3600);
 
    $db->prepare("UPDATE creneaux SET qr_token = ?, qr_expire = ?, qr_genere_le = NOW() WHERE id = ?")
       ->execute([$token, $expire, $idCreneau]);
 
    echo json_encode(['succes' => true, 'token' => $token, 'expire' => $expire]);
    exit;
}
 
AuthMiddleware::erreur('Route non trouvee', 404);
 
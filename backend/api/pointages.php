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

    $timestamp = time();
    $data      = $idCreneau . '|' . $timestamp;
    $hash      = hash_hmac('sha256', $data, QR_SECRET_KEY);
    $token     = base64_encode($idCreneau . '|' . $timestamp . '|' . $hash);

    // ✅ Fenetre horaire : valide de heure_debut - 15min à heure_debut + 15min
    $heureDebut    = strtotime($creneau['semaine_debut'] . ' ' . $creneau['heure_debut']);
    $fenetre_debut = $heureDebut - (QR_FENETRE_MINUTES * 60);
    $fenetre_fin   = $heureDebut + (QR_FENETRE_MINUTES * 60);
    $expire        = date('Y-m-d H:i:s', $fenetre_fin);

    $db->prepare("UPDATE creneaux SET qr_token = ?, qr_expire = ?, qr_genere_le = NOW(), qr_utilise = 0 WHERE id = ?")
       ->execute([$token, $expire, $idCreneau]);

    $urlPointage = 'http://localhost:3000/pointage?token=' . urlencode($token);

    echo json_encode([
        'succes'          => true,
        'token'           => $token,
        'url_pointage'    => $urlPointage,
        'expire'          => $expire,
        'fenetre_debut'   => date('H:i', $fenetre_debut),
        'fenetre_fin'     => date('H:i', $fenetre_fin),
        'seance'          => [
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

if ($method === 'POST' && $action === 'pointer') {
    $user    = AuthMiddleware::exigerRole(['enseignant']);
    $body    = json_decode(file_get_contents('php://input'), true);
    $tokenQR = $body['token_qr'] ?? '';
    if (!$tokenQR) AuthMiddleware::erreur('Token QR requis', 400);

    // Décoder et vérifier le token
    $decoded = base64_decode($tokenQR);
    $parts   = explode('|', $decoded);
    if (count($parts) !== 3) AuthMiddleware::erreur('Token invalide', 400);

    [$idCreneau, $timestamp, $hashRecu] = $parts;
    $hashAttendu = hash_hmac('sha256', $idCreneau . '|' . $timestamp, QR_SECRET_KEY);

    if (!hash_equals($hashAttendu, $hashRecu)) {
        // ✅ Logger la tentative échouée
        $db->prepare("
            INSERT INTO logs_activite (id_utilisateur, action, details_json, ip, date_heure)
            VALUES (?, 'scan_qr_echec', ?, ?, NOW())
        ")->execute([$user['id'], json_encode(['token' => substr($tokenQR, 0, 20), 'raison' => 'signature_invalide']), $_SERVER['REMOTE_ADDR'] ?? '']);
        AuthMiddleware::erreur('Token QR invalide — signature incorrecte', 401);
    }

    // Vérifier le créneau en base
    $stmt = $db->prepare("SELECT * FROM creneaux WHERE id = ? AND qr_token = ?");
    $stmt->execute([$idCreneau, $tokenQR]);
    $creneau = $stmt->fetch();

    if (!$creneau) {
        AuthMiddleware::erreur('QR Code deja utilise ou invalide', 400);
    }

    // ✅ CONTROLE 1 : QR Code à usage unique
    if ((int)($creneau['qr_utilise'] ?? 0) === 1) {
        AuthMiddleware::erreur('Ce QR Code a deja ete utilise — usage unique', 400);
    }

    // ✅ CONTROLE 2 : Vérification expiration
    if (strtotime($creneau['qr_expire']) < time()) {
        AuthMiddleware::erreur('QR Code expire — la fenetre horaire est depassee', 400);
    }

    // ✅ CONTROLE 3 : Fenetre horaire ±15 minutes
    $heureDebut     = strtotime($creneau['semaine_debut'] . ' ' . $creneau['heure_debut']);
    $fenetre_debut  = $heureDebut - (QR_FENETRE_MINUTES * 60);
    $fenetre_fin    = $heureDebut + (QR_FENETRE_MINUTES * 60);
    $maintenant     = time();

    if ($maintenant < $fenetre_debut) {
        $minutesAvant = round(($fenetre_debut - $maintenant) / 60);
        AuthMiddleware::erreur("Trop tot — le pointage ouvre dans $minutesAvant minute(s)", 400);
    }

    if ($maintenant > $fenetre_fin) {
        AuthMiddleware::erreur('Fenetre horaire depassee — pointage impossible', 400);
    }

    // Récupérer l'enseignant
    $stmtE = $db->prepare("SELECT id_lien FROM utilisateurs WHERE id = ?");
    $stmtE->execute([$user['id']]);
    $idEnseignant = $stmtE->fetchColumn();

    // ✅ CONTROLE 4 : Alerte retard (> 30 min après heure prévue)
    $retard  = $maintenant - $heureDebut;
    $statut  = ($retard > 1800) ? 'retard' : 'valide';
    $alerte  = ($retard > 1800) ? round($retard / 60) . ' minutes de retard' : null;

    try {
        // 1. Enregistrer le pointage
        $db->prepare("
            INSERT INTO pointages (id_creneau, id_enseignant, heure_pointage_reelle, ip_source, token_utilise, statut)
            VALUES (?, ?, NOW(), ?, ?, ?)
        ")->execute([$idCreneau, $idEnseignant, $_SERVER['REMOTE_ADDR'] ?? '', $tokenQR, $statut]);

        // 2. ✅ Marquer QR comme utilisé (usage unique) + mettre créneau en cours
        $db->prepare("UPDATE creneaux SET qr_token = NULL, qr_utilise = 1, statut = 'en_cours' WHERE id = ?")
           ->execute([$idCreneau]);

        // 3. Logger le scan réussi
        $db->prepare("
            INSERT INTO logs_activite (id_utilisateur, action, details_json, ip, date_heure)
            VALUES (?, 'scan_qr_succes', ?, ?, NOW())
        ")->execute([$user['id'], json_encode(['id_creneau' => $idCreneau, 'statut' => $statut]), $_SERVER['REMOTE_ADDR'] ?? '']);

        // 4. Créer automatiquement le cahier de texte
        $stmtCheck = $db->prepare("SELECT id FROM cahiers_texte WHERE id_creneau = ?");
        $stmtCheck->execute([$idCreneau]);
        if (!$stmtCheck->fetch()) {
            $stmtDelegue = $db->prepare("
                SELECT u.id FROM utilisateurs u
                JOIN creneaux cr ON cr.id = ?
                JOIN emploi_temps et ON cr.id_emploi_temps = et.id
                WHERE u.role = 'delegue'
                LIMIT 1
            ");
            $stmtDelegue->execute([$idCreneau]);
            $idDelegue = $stmtDelegue->fetchColumn() ?: 1;

            $db->prepare("
                INSERT INTO cahiers_texte (id_creneau, id_delegue, titre_cours, contenu_json, statut)
                VALUES (?, ?, '', '{}', 'brouillon')
            ")->execute([$idCreneau, $idDelegue]);
        }

        $reponse = [
            'succes'  => true,
            'message' => 'Pointage enregistre avec succes.',
            'statut'  => $statut,
            'heure'   => date('H:i:s'),
        ];

        // ✅ Ajouter alerte si retard
        if ($alerte) {
            $reponse['alerte'] = "⚠️ Retard detecte : $alerte — le surveillant a ete notifie";
        }

        echo json_encode($reponse);

    } catch (Exception $e) {
        AuthMiddleware::erreur('Ce creneau a deja ete pointe', 409);
    }
    exit;
}

if ($method === 'GET' && $action === 'liste') {
    AuthMiddleware::exigerRole(['administrateur', 'surveillant']);
    $stmt = $db->query("
        SELECT p.*, CONCAT(e.prenom,' ',e.nom) AS enseignant,
               m.libelle AS matiere, c.jour, c.heure_debut
        FROM pointages p
        JOIN enseignants e ON p.id_enseignant = e.id
        JOIN creneaux c    ON p.id_creneau = c.id
        JOIN matieres m    ON c.id_matiere = m.id
        ORDER BY p.created_at DESC LIMIT 50
    ");
    echo json_encode(['succes' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

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

AuthMiddleware::erreur('Route non trouvee', 404);
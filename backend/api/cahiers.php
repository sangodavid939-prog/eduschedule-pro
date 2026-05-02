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

// GET : liste des cahiers
if ($method === 'GET' && $action === 'liste') {
    $user = AuthMiddleware::authentifier();

    $sql = "
        SELECT ct.*, c.jour, c.heure_debut, c.heure_fin,
               m.libelle AS matiere, cl.libelle AS classe,
               CONCAT(e.prenom,' ',e.nom) AS enseignant,
               et.semaine_debut,
               (SELECT horodatage FROM signatures s WHERE s.id_cahier = ct.id AND s.type_signataire = 'delegue' LIMIT 1) AS signe_delegue_le,
               (SELECT horodatage FROM signatures s WHERE s.id_cahier = ct.id AND s.type_signataire = 'enseignant' LIMIT 1) AS signe_enseignant_le
        FROM cahiers_texte ct
        JOIN creneaux c      ON ct.id_creneau = c.id
        JOIN emploi_temps et ON c.id_emploi_temps = et.id
        JOIN matieres m      ON c.id_matiere = m.id
        JOIN classes cl      ON et.id_classe = cl.id
        JOIN enseignants e   ON c.id_enseignant = e.id
        WHERE 1=1
    ";
    $params = [];

    if ($user['role'] === 'enseignant') {
        $sql .= " AND c.id_enseignant = (SELECT id_lien FROM utilisateurs WHERE id = ?)";
        $params[] = $user['id'];
    }

    if ($user['role'] === 'delegue') {
    $sql .= " AND ct.id_delegue = ?";
    $params[] = $user['id'];
}

    $sql .= " ORDER BY et.semaine_debut DESC, c.heure_debut DESC";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    echo json_encode(['succes' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

// GET : detail d'un cahier
if ($method === 'GET' && $action === 'detail') {
    $user = AuthMiddleware::authentifier();
    $id   = (int)($_GET['id'] ?? 0);

    $stmt = $db->prepare("
        SELECT ct.*, c.jour, c.heure_debut, c.heure_fin,
               m.libelle AS matiere, cl.libelle AS classe,
               CONCAT(e.prenom,' ',e.nom) AS enseignant,
               et.semaine_debut
        FROM cahiers_texte ct
        JOIN creneaux c      ON ct.id_creneau = c.id
        JOIN emploi_temps et ON c.id_emploi_temps = et.id
        JOIN matieres m      ON c.id_matiere = m.id
        JOIN classes cl      ON et.id_classe = cl.id
        JOIN enseignants e   ON c.id_enseignant = e.id
        WHERE ct.id = ?
    ");
    $stmt->execute([$id]);
    $cahier = $stmt->fetch();
    if (!$cahier) AuthMiddleware::erreur('Cahier introuvable', 404);

    $stmtSig = $db->prepare("SELECT * FROM signatures WHERE id_cahier = ?");
    $stmtSig->execute([$id]);
    $cahier['signatures'] = $stmtSig->fetchAll();

    $stmtT = $db->prepare("SELECT * FROM travaux_demandes WHERE id_cahier = ?");
    $stmtT->execute([$id]);
    $cahier['travaux'] = $stmtT->fetchAll();

    echo json_encode(['succes' => true, 'data' => $cahier]);
    exit;
}

// POST : modifier un cahier (délégué remplit le contenu)
if ($method === 'POST' && $action === 'modifier') {
    $user = AuthMiddleware::exigerRole(['delegue', 'administrateur']);
    $body = json_decode(file_get_contents('php://input'), true);
    $id   = (int)($body['id'] ?? 0);

    $stmt = $db->prepare("SELECT statut FROM cahiers_texte WHERE id = ?");
    $stmt->execute([$id]);
    $cahier = $stmt->fetch();
    if (!$cahier) AuthMiddleware::erreur('Cahier introuvable', 404);

    // ✅ CONTROLE : bloquer si déjà clôturé
    if ($cahier['statut'] === 'cloture') {
        AuthMiddleware::erreur('Cahier cloture — modification impossible', 403);
    }
    // ✅ CONTROLE : bloquer si déjà signé par le délégué
    if ($cahier['statut'] === 'signe_delegue') {
        AuthMiddleware::erreur('Cahier deja signe par le delegue — modification impossible', 403);
    }

    $db->prepare("
        UPDATE cahiers_texte
        SET titre_cours = ?, contenu_json = ?, niveau_avancement = ?, statut = 'en_cours'
        WHERE id = ?
    ")->execute([
        $body['titre_cours']       ?? '',
        $body['contenu_json']      ?? '{}',
        $body['niveau_avancement'] ?? '',
        $id
    ]);

    // Mettre à jour les travaux demandés
    if (!empty($body['travaux'])) {
        $db->prepare("DELETE FROM travaux_demandes WHERE id_cahier = ?")->execute([$id]);
        $stmtT = $db->prepare("INSERT INTO travaux_demandes (id_cahier, description, date_limite, type) VALUES (?, ?, ?, ?)");
        foreach ($body['travaux'] as $t) {
            $stmtT->execute([$id, $t['description'], $t['date_limite'] ?? null, $t['type'] ?? 'devoir']);
        }
    }

    echo json_encode(['succes' => true, 'message' => 'Contenu sauvegarde']);
    exit;
}

// POST : signer un cahier
if ($method === 'POST' && $action === 'signer') {
    $user = AuthMiddleware::exigerRole(['delegue', 'enseignant', 'administrateur']);
    $body = json_decode(file_get_contents('php://input'), true);

    $id        = (int)($body['id'] ?? 0);
    $signature = $body['signature_base64'] ?? '';
    $type      = $body['type'] ?? '';

    if (!$signature) AuthMiddleware::erreur('Signature manquante', 400);
    if (!in_array($type, ['delegue', 'enseignant'])) AuthMiddleware::erreur('Type invalide', 400);

    $stmt = $db->prepare("SELECT statut FROM cahiers_texte WHERE id = ?");
    $stmt->execute([$id]);
    $cahier = $stmt->fetch();
    if (!$cahier) AuthMiddleware::erreur('Cahier introuvable', 404);

    // ✅ CONTROLE : le délégué ne peut signer que si le contenu est rempli
    if ($type === 'delegue' && $cahier['statut'] === 'brouillon') {
        AuthMiddleware::erreur('Le delegue doit remplir le contenu avant de signer', 400);
    }

    // ✅ CONTROLE : l'enseignant ne peut signer que si le délégué a signé
    if ($type === 'enseignant' && $cahier['statut'] !== 'signe_delegue') {
        AuthMiddleware::erreur('Le delegue doit signer avant l enseignant', 400);
    }

    // ✅ CONTROLE : cahier déjà clôturé
    if ($cahier['statut'] === 'cloture') {
        AuthMiddleware::erreur('Ce cahier est deja cloture', 400);
    }

    try {
        $db->prepare("
            INSERT INTO signatures (id_cahier, type_signataire, id_utilisateur, signature_base64, ip_source)
            VALUES (?, ?, ?, ?, ?)
        ")->execute([$id, $type, $user['id'], $signature, $_SERVER['REMOTE_ADDR'] ?? '']);

        $nouveauStatut = $type === 'delegue' ? 'signe_delegue' : 'cloture';
        $db->prepare("UPDATE cahiers_texte SET statut = ? WHERE id = ?")->execute([$nouveauStatut, $id]);

        echo json_encode(['succes' => true, 'message' => 'Signature enregistree']);
    } catch (Exception $e) {
        AuthMiddleware::erreur('Vous avez deja signe ce cahier', 409);
    }
    exit;
}

// POST : clôture par l'enseignant (heure de fin + signature)
if ($method === 'POST' && $action === 'cloture') {
    $user = AuthMiddleware::exigerRole(['enseignant', 'administrateur']);
    $body = json_decode(file_get_contents('php://input'), true);
    $id   = (int)($body['id'] ?? 0);

    $stmt = $db->prepare("SELECT statut FROM cahiers_texte WHERE id = ?");
    $stmt->execute([$id]);
    $cahier = $stmt->fetch();
    if (!$cahier) AuthMiddleware::erreur('Cahier introuvable', 404);

    // ✅ CONTROLE : l'enseignant ne peut clôturer que si le délégué a signé
    if ($cahier['statut'] !== 'signe_delegue') {
        AuthMiddleware::erreur('Le delegue doit signer avant que l enseignant puisse cloturer', 400);
    }

    $heureFin  = $body['heure_fin']       ?? date('H:i:s');
    $signature = $body['signature_base64'] ?? '';

    // Enregistrer la signature enseignant
    if ($signature) {
        try {
            $db->prepare("
                INSERT INTO signatures (id_cahier, type_signataire, id_utilisateur, signature_base64, ip_source)
                VALUES (?, 'enseignant', ?, ?, ?)
            ")->execute([$id, $user['id'], $signature, $_SERVER['REMOTE_ADDR'] ?? '']);
        } catch (Exception $e) {
            // Signature déjà existante, on continue
        }
    }

    // Clôturer le cahier
    $db->prepare("
        UPDATE cahiers_texte
        SET statut = 'cloture', heure_fin_reelle = ?, date_cloture = NOW()
        WHERE id = ?
    ")->execute([$heureFin, $id]);

    // Mettre le créneau en statut terminé
    $db->prepare("
        UPDATE creneaux SET statut = 'termine'
        WHERE id = (SELECT id_creneau FROM cahiers_texte WHERE id = ?)
    ")->execute([$id]);

    echo json_encode(['succes' => true, 'message' => 'Seance cloturee avec succes']);
    exit;
}

AuthMiddleware::erreur('Route non trouvee', 404);
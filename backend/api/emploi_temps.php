<?php
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
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

if ($method === 'GET' && $action === 'creneaux_jour') {
    AuthMiddleware::exigerRole(['surveillant', 'administrateur']);
    $jours = ['Monday'=>'lundi','Tuesday'=>'mardi','Wednesday'=>'mercredi',
              'Thursday'=>'jeudi','Friday'=>'vendredi','Saturday'=>'samedi','Sunday'=>'dimanche'];
    $jour = $jours[date('l')] ?? 'lundi';
    $stmt = $db->prepare("
        SELECT cr.id, cr.jour, cr.heure_debut, cr.heure_fin, cr.statut,
               m.libelle AS matiere, cl.libelle AS classe,
               CONCAT(e.prenom,' ',e.nom) AS enseignant,
               e.id AS id_enseignant, et.semaine_debut
        FROM creneaux cr
        JOIN emploi_temps et ON cr.id_emploi_temps = et.id
        JOIN matieres m      ON cr.id_matiere = m.id
        JOIN classes cl      ON et.id_classe = cl.id
        JOIN enseignants e   ON cr.id_enseignant = e.id
        WHERE cr.jour = ? AND cr.statut != 'annule'
        ORDER BY cr.heure_debut
    ");
    $stmt->execute([$jour]);
    echo json_encode(['succes' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

if ($method === 'GET') {
    $utilisateurAuth = AuthMiddleware::authentifier();
    $type     = $_GET['type']      ?? null;
    $idClasse = $_GET['id_classe'] ?? null;

    // Étudiant : récupérer automatiquement son id_classe
    if ($utilisateurAuth['role'] === 'etudiant' && !$type) {
        $stmtEtu = $db->prepare("SELECT id_classe FROM etudiants WHERE id = ? AND actif = 1");
        $stmtEtu->execute([$utilisateurAuth['id_lien']]);
        $etu = $stmtEtu->fetch();
        if (!$etu) AuthMiddleware::erreur('Étudiant introuvable', 404);
        $idClasse = $etu['id_classe'];
    }

    if ($type === 'enseignants') {
        $stmt = $db->query("SELECT * FROM enseignants WHERE actif = 1 ORDER BY nom");
        echo json_encode(['succes' => true, 'data' => $stmt->fetchAll()]);
        exit;
    }
    if ($type === 'etudiants') {
        $stmt = $db->query("
            SELECT et.*, cl.libelle AS nom_classe
            FROM etudiants et
            LEFT JOIN classes cl ON et.id_classe = cl.id
            WHERE et.actif = 1
            ORDER BY et.nom, et.prenom
        ");
        echo json_encode(['succes' => true, 'data' => $stmt->fetchAll()]);
        exit;
    }
    if ($type === 'matieres') {
        $stmt = $db->query("SELECT * FROM matieres ORDER BY libelle");
        echo json_encode(['succes' => true, 'data' => $stmt->fetchAll()]);
        exit;
    }
    if ($type === 'salles') {
        $stmt = $db->query("SELECT * FROM salles WHERE disponible = 1 ORDER BY code");
        echo json_encode(['succes' => true, 'data' => $stmt->fetchAll()]);
        exit;
    }
    if ($type === 'toutes_salles') {
        $stmt = $db->query("SELECT * FROM salles ORDER BY code");
        echo json_encode(['succes' => true, 'data' => $stmt->fetchAll()]);
        exit;
    }

    if ($idClasse) {
        $semaine = $_GET['semaine'] ?? '';

        // Trouver la semaine la plus proche <= date choisie
        // Cela permet d'afficher le planning quelle que soit la date de la semaine choisie
        if ($semaine) {
            $stmtSemaine = $db->prepare("
                SELECT semaine_debut FROM emploi_temps
                WHERE id_classe = ?
                AND semaine_debut <= ?
                AND statut_publication = 'publie'
                ORDER BY semaine_debut DESC
                LIMIT 1
            ");
            $stmtSemaine->execute([$idClasse, $semaine]);
            $row = $stmtSemaine->fetch();
            if ($row) {
                $semaine = $row['semaine_debut'];
            }
        }

        $stmt = $db->prepare("
            SELECT c.id, c.jour, c.heure_debut, c.heure_fin,
                   c.id_matiere, c.id_enseignant, c.id_salle,
                   m.libelle AS matiere, m.code AS code_matiere,
                   CONCAT(e.prenom, ' ', e.nom) AS enseignant,
                   s.code AS salle,
                   et.semaine_debut, et.statut_publication,
                   c.statut, c.qr_token
            FROM creneaux c
            JOIN emploi_temps et ON c.id_emploi_temps = et.id
            JOIN matieres m      ON c.id_matiere = m.id
            JOIN enseignants e   ON c.id_enseignant = e.id
            JOIN salles s        ON c.id_salle = s.id
            WHERE et.id_classe = ?
            AND et.statut_publication = 'publie'
            AND c.statut != 'annule'
            AND (? = '' OR et.semaine_debut = ?)
            ORDER BY FIELD(c.jour,'lundi','mardi','mercredi','jeudi','vendredi','samedi'), c.heure_debut
        ");
        $stmt->execute([$idClasse, $semaine, $semaine]);
        $creneaux = $stmt->fetchAll();
        $planning = [];
        foreach (['lundi','mardi','mercredi','jeudi','vendredi','samedi'] as $j) {
            $planning[$j] = [];
        }
        foreach ($creneaux as $c) {
            $planning[$c['jour']][] = $c;
        }
        echo json_encode(['succes' => true, 'data' => $planning, 'semaine_affichee' => $semaine]);
        exit;
    }

    $stmt = $db->query("SELECT * FROM classes ORDER BY niveau, code");
    echo json_encode(['succes' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

if ($method === 'POST') {
    AuthMiddleware::exigerRole(['administrateur']);
    $body = json_decode(file_get_contents('php://input'), true);

    if ($action === 'modifier') {
        $id = (int)($body['id'] ?? 0);
        $heureDebut = $body['heure_debut'] ?? '';
        $heureFin   = $body['heure_fin']   ?? '';
        if (strlen($heureDebut) === 5) $heureDebut .= ':00';
        if (strlen($heureFin)   === 5) $heureFin   .= ':00';
        $db->prepare("UPDATE creneaux SET jour=?, heure_debut=?, heure_fin=?, id_matiere=?, id_enseignant=?, id_salle=? WHERE id=?")
           ->execute([$body['jour'], $heureDebut, $heureFin, $body['id_matiere'], $body['id_enseignant'], $body['id_salle'], $id]);
        echo json_encode(['succes' => true]);
        exit;
    }
    if ($action === 'supprimer') {
        $db->prepare("UPDATE creneaux SET statut='annule' WHERE id=?")->execute([$body['id']]);
        echo json_encode(['succes' => true]);
        exit;
    }
    if ($action === 'dupliquer') {
        $idClasse = (int)($body['id_classe'] ?? 0);
        $semaineActuelle = $body['semaine_actuelle'] ?? '';
        if (!$idClasse || !$semaineActuelle) AuthMiddleware::erreur('id_classe et semaine_actuelle requis', 400);
        $dateSuivante = date('Y-m-d', strtotime($semaineActuelle . ' +7 days'));
        $stmtET = $db->prepare("SELECT id FROM emploi_temps WHERE id_classe = ? AND semaine_debut = ?");
        $stmtET->execute([$idClasse, $semaineActuelle]);
        $et = $stmtET->fetch();
        if (!$et) AuthMiddleware::erreur('Aucun planning trouve', 404);
        $stmtCr = $db->prepare("SELECT * FROM creneaux WHERE id_emploi_temps = ? AND statut != 'annule'");
        $stmtCr->execute([$et['id']]);
        $creneaux = $stmtCr->fetchAll();
        if (empty($creneaux)) AuthMiddleware::erreur('Aucun creneau a dupliquer', 404);
        $db->prepare("INSERT IGNORE INTO emploi_temps (id_classe, semaine_debut, statut_publication, cree_par) VALUES (?, ?, 'publie', 1)")->execute([$idClasse, $dateSuivante]);
        $stmtNET = $db->prepare("SELECT id FROM emploi_temps WHERE id_classe = ? AND semaine_debut = ?");
        $stmtNET->execute([$idClasse, $dateSuivante]);
        $idNouvelET = $stmtNET->fetch()['id'];
        $stmtInsert = $db->prepare("INSERT INTO creneaux (id_emploi_temps, id_matiere, id_enseignant, id_salle, jour, heure_debut, heure_fin) VALUES (?, ?, ?, ?, ?, ?, ?)");
        foreach ($creneaux as $c) {
            $stmtInsert->execute([$idNouvelET, $c['id_matiere'], $c['id_enseignant'], $c['id_salle'], $c['jour'], $c['heure_debut'], $c['heure_fin']]);
        }
        echo json_encode(['succes' => true, 'semaine_suivante' => $dateSuivante, 'nb_creneaux' => count($creneaux)]);
        exit;
    }
    if ($action === 'creer_salle') {
    try {
        $db->prepare("INSERT INTO salles (code, capacite, equipements, batiment, disponible) VALUES (?, ?, ?, ?, ?)")
           ->execute([$body['code'], $body['capacite'], $body['equipements'] ?? '', $body['batiment'] ?? '', $body['disponible'] ?? 1]);
        echo json_encode(['succes' => true, 'id' => (int)$db->lastInsertId()]);
    } catch (Exception $e) { AuthMiddleware::erreur('Code deja existant', 409); }
    exit;
}
    
if ($action === 'modifier_salle') {
    $db->prepare("UPDATE salles SET code=?, capacite=?, equipements=?, batiment=?, disponible=? WHERE id=?")
       ->execute([$body['code'], $body['capacite'], $body['equipements'] ?? '', $body['batiment'] ?? '', $body['disponible'] ?? 1, $body['id']]);
    echo json_encode(['succes' => true]);
    exit;
}
    if ($action === 'supprimer_salle') {
    $db->prepare("DELETE FROM salles WHERE id = ?")->execute([$body['id']]);
    echo json_encode(['succes' => true]);
    exit;
}
    if ($action === 'creer_enseignant') {
        try {
            $db->prepare("INSERT INTO enseignants (matricule, nom, prenom, email, telephone, specialite, statut, taux_horaire, grade) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
               ->execute([$body['matricule'], $body['nom'], $body['prenom'], $body['email'], $body['telephone'] ?? '', $body['specialite'] ?? '', $body['statut'], $body['taux_horaire'], $body['grade'] ?? '']);
            $idEnseignant = (int)$db->lastInsertId();
            $db->prepare("INSERT INTO utilisateurs (email, mot_de_passe_hash, role, nom_affichage, id_lien, actif) VALUES (?, ?, 'enseignant', ?, ?, 1)")
               ->execute([$body['email'], password_hash($body['mot_de_passe'] ?? $body['matricule'], PASSWORD_DEFAULT), $body['prenom'] . ' ' . $body['nom'], $idEnseignant]);
            echo json_encode(['succes' => true, 'id' => $idEnseignant]);
        } catch (Exception $e) { AuthMiddleware::erreur('Matricule ou email deja existant', 409); }
        exit;
    }
    if ($action === 'modifier_enseignant') {
        $db->prepare("UPDATE enseignants SET matricule=?, nom=?, prenom=?, email=?, telephone=?, specialite=?, statut=?, taux_horaire=?, grade=? WHERE id=?")
           ->execute([$body['matricule'], $body['nom'], $body['prenom'], $body['email'], $body['telephone'] ?? '', $body['specialite'] ?? '', $body['statut'], $body['taux_horaire'], $body['grade'] ?? '', $body['id']]);
        $db->prepare("UPDATE utilisateurs SET email=?, nom_affichage=? WHERE id_lien=? AND role='enseignant'")
           ->execute([$body['email'], $body['prenom'] . ' ' . $body['nom'], $body['id']]);
        if (!empty($body['mot_de_passe'])) {
            $db->prepare("UPDATE utilisateurs SET mot_de_passe_hash=? WHERE id_lien=? AND role='enseignant'")
               ->execute([password_hash($body['mot_de_passe'], PASSWORD_DEFAULT), $body['id']]);
        }
        echo json_encode(['succes' => true]);
        exit;
    }
    if ($action === 'supprimer_enseignant') {
        $db->prepare("UPDATE enseignants SET actif = 0 WHERE id = ?")->execute([$body['id']]);
        $db->prepare("UPDATE utilisateurs SET actif = 0 WHERE email = (SELECT email FROM enseignants WHERE id = ?)")->execute([$body['id']]);
        echo json_encode(['succes' => true]);
        exit;
    }
    if ($action === 'creer_etudiant') {
        try {
            $db->prepare("INSERT INTO etudiants (matricule, nom, prenom, email, telephone, id_classe, actif) VALUES (?, ?, ?, ?, ?, ?, 1)")
               ->execute([$body['matricule'] ?? '', $body['nom'], $body['prenom'], $body['email'], $body['telephone'] ?? '', $body['id_classe']]);
            $idEtudiant = (int)$db->lastInsertId();
            $db->prepare("INSERT INTO utilisateurs (email, mot_de_passe_hash, role, nom_affichage, id_lien, actif) VALUES (?, ?, 'etudiant', ?, ?, 1)")
               ->execute([$body['email'], password_hash($body['mot_de_passe'], PASSWORD_DEFAULT), $body['prenom'] . ' ' . $body['nom'], $idEtudiant]);
            echo json_encode(['succes' => true, 'id' => $idEtudiant]);
        } catch (Exception $e) { AuthMiddleware::erreur('Matricule ou email déjà existant', 409); }
        exit;
    }
    if ($action === 'modifier_etudiant') {
        $db->prepare("UPDATE etudiants SET matricule=?, nom=?, prenom=?, email=?, telephone=?, id_classe=? WHERE id=?")
           ->execute([$body['matricule'] ?? '', $body['nom'], $body['prenom'], $body['email'], $body['telephone'] ?? '', $body['id_classe'], $body['id']]);
        $db->prepare("UPDATE utilisateurs SET email=?, nom_affichage=? WHERE id_lien=? AND role='etudiant'")
           ->execute([$body['email'], $body['prenom'] . ' ' . $body['nom'], $body['id']]);
        if (!empty($body['mot_de_passe'])) {
            $db->prepare("UPDATE utilisateurs SET mot_de_passe_hash=? WHERE id_lien=? AND role='etudiant'")
               ->execute([password_hash($body['mot_de_passe'], PASSWORD_DEFAULT), $body['id']]);
        }
        echo json_encode(['succes' => true]);
        exit;
    }
    if ($action === 'supprimer_etudiant') {
        $db->prepare("UPDATE etudiants SET actif = 0 WHERE id = ?")->execute([$body['id']]);
        $db->prepare("UPDATE utilisateurs SET actif = 0 WHERE id_lien=? AND role='etudiant'")->execute([$body['id']]);
        echo json_encode(['succes' => true]);
        exit;
    }

    // Creer un planning
    $idClasse     = (int)($body['id_classe']    ?? 0);
    $semaineDebut = $body['semaine_debut']       ?? '';
    $creneaux     = $body['creneaux']            ?? [];
    if (!$idClasse || !$semaineDebut) AuthMiddleware::erreur('id_classe et semaine_debut requis', 400);
    $conflits = [];
    foreach ($creneaux as $c) {
        $stmtC = $db->prepare("SELECT cr.id FROM creneaux cr JOIN emploi_temps et ON cr.id_emploi_temps = et.id WHERE cr.id_enseignant = ? AND cr.jour = ? AND et.semaine_debut = ? AND cr.statut != 'annule' AND cr.heure_debut < ? AND cr.heure_fin > ?");
        $stmtC->execute([$c['id_enseignant'], $c['jour'], $semaineDebut, $c['heure_fin'], $c['heure_debut']]);
        if ($stmtC->fetch()) $conflits[] = ['type' => 'enseignant'];
        $stmtS = $db->prepare("SELECT cr.id FROM creneaux cr JOIN emploi_temps et ON cr.id_emploi_temps = et.id WHERE cr.id_salle = ? AND cr.jour = ? AND et.semaine_debut = ? AND cr.statut != 'annule' AND cr.heure_debut < ? AND cr.heure_fin > ?");
        $stmtS->execute([$c['id_salle'], $c['jour'], $semaineDebut, $c['heure_fin'], $c['heure_debut']]);
        if ($stmtS->fetch()) $conflits[] = ['type' => 'salle'];
    }
    if (!empty($conflits)) { http_response_code(409); echo json_encode(['succes' => false, 'conflits' => $conflits]); exit; }
    $stmtET = $db->prepare("SELECT id FROM emploi_temps WHERE id_classe = ? AND semaine_debut = ?");
    $stmtET->execute([$idClasse, $semaineDebut]);
    $et = $stmtET->fetch();
    if ($et) { $idET = $et['id']; }
    else {
        $db->prepare("INSERT INTO emploi_temps (id_classe, semaine_debut, statut_publication, cree_par) VALUES (?, ?, 'publie', 1)")->execute([$idClasse, $semaineDebut]);
        $idET = (int)$db->lastInsertId();
    }
    $stmtCr = $db->prepare("INSERT INTO creneaux (id_emploi_temps, id_matiere, id_enseignant, id_salle, jour, heure_debut, heure_fin) VALUES (?, ?, ?, ?, ?, ?, ?)");
    foreach ($creneaux as $c) {
        $stmtCr->execute([$idET, $c['id_matiere'], $c['id_enseignant'], $c['id_salle'], $c['jour'], $c['heure_debut'].':00', $c['heure_fin'].':00']);
    }
    http_response_code(201);
    echo json_encode(['succes' => true, 'id' => $idET]);
    exit;
}

AuthMiddleware::erreur('Route non trouvee', 404);

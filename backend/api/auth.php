<?php
// EduSchedule Pro — API Authentification

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

AuthMiddleware::configCORS();

$db     = (new Database())->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$action = $_GET['action'] ?? '';

// ===== GET =====
if ($method === 'GET') {

    // GET /api/auth.php?action=liste_utilisateurs
    if ($action === 'liste_utilisateurs') {
        AuthMiddleware::exigerRole(['administrateur']);
        $stmt = $db->query("
            SELECT id, email, role, nom_affichage, actif,
                   SUBSTRING_INDEX(nom_affichage, ' ', -1) AS nom,
                   SUBSTRING_INDEX(nom_affichage, ' ', 1)  AS prenom,
                   '' AS telephone
            FROM utilisateurs
            WHERE role IN ('delegue', 'surveillant', 'comptable', 'administrateur')
            AND actif = 1
            ORDER BY role, nom_affichage
        ");
        echo json_encode(['succes' => true, 'data' => $stmt->fetchAll()]);
        exit;
    }

    // GET /api/auth/me
    if (str_ends_with($uri, '/auth/me')) {
        $user = AuthMiddleware::authentifier();
        echo json_encode(['succes' => true, 'utilisateur' => $user]);
        exit;
    }

    AuthMiddleware::erreur('Route non trouvée', 404);
}

// ===== POST =====
if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);

    // Connexion
    if ($action === '' && !isset($body['action'])) {
        $email    = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';

        if (!$email || !$password) {
            AuthMiddleware::erreur('Email et mot de passe requis', 400);
        }

        $stmt = $db->prepare(
            "SELECT * FROM utilisateurs WHERE email = ? AND actif = 1 LIMIT 1"
        );
        $stmt->execute([$email]);
        $utilisateur = $stmt->fetch();

        if (!$utilisateur || !password_verify($password, $utilisateur['mot_de_passe_hash'])) {
            AuthMiddleware::erreur('Email ou mot de passe incorrect', 401);
        }

        $payload = [
            'id'      => $utilisateur['id'],
            'email'   => $utilisateur['email'],
            'role'    => $utilisateur['role'],
            'nom'     => $utilisateur['nom_affichage'],
            'id_lien' => $utilisateur['id_lien'],
        ];

        $token = AuthMiddleware::genererToken($payload);

        $db->prepare("UPDATE utilisateurs SET dernier_login = NOW() WHERE id = ?")
           ->execute([$utilisateur['id']]);

        http_response_code(200);
        echo json_encode([
            'succes'      => true,
            'token'       => $token,
            'utilisateur' => [
                'id'      => $utilisateur['id'],
                'email'   => $utilisateur['email'],
                'role'    => $utilisateur['role'],
                'nom'     => $utilisateur['nom_affichage'],
                'id_lien' => $utilisateur['id_lien'],
            ]
        ]);
        exit;
    }

    // Créer un utilisateur (délégué, surveillant, comptable, admin)
    if ($action === 'creer_utilisateur') {
        AuthMiddleware::exigerRole(['administrateur']);
        try {
            $nomAffichage = trim($body['prenom'] . ' ' . $body['nom']);
            $db->prepare("
                INSERT INTO utilisateurs (email, mot_de_passe_hash, role, nom_affichage, actif)
                VALUES (?, ?, ?, ?, 1)
            ")->execute([
                $body['email'],
                password_hash($body['mot_de_passe'], PASSWORD_DEFAULT),
                $body['role'],
                $nomAffichage,
            ]);
            echo json_encode(['succes' => true, 'id' => (int)$db->lastInsertId()]);
        } catch (Exception $e) {
            AuthMiddleware::erreur('Email déjà existant', 409);
        }
        exit;
    }

    // Modifier un utilisateur
    if ($action === 'modifier_utilisateur') {
        AuthMiddleware::exigerRole(['administrateur']);
        $nomAffichage = trim($body['prenom'] . ' ' . $body['nom']);
        $db->prepare("
            UPDATE utilisateurs SET email=?, role=?, nom_affichage=? WHERE id=?
        ")->execute([
            $body['email'],
            $body['role'],
            $nomAffichage,
            $body['id'],
        ]);
        if (!empty($body['mot_de_passe'])) {
            $db->prepare("UPDATE utilisateurs SET mot_de_passe_hash=? WHERE id=?")
               ->execute([password_hash($body['mot_de_passe'], PASSWORD_DEFAULT), $body['id']]);
        }
        echo json_encode(['succes' => true]);
        exit;
    }

    // Désactiver un utilisateur
    if ($action === 'supprimer_utilisateur') {
        AuthMiddleware::exigerRole(['administrateur']);
        $db->prepare("UPDATE utilisateurs SET actif = 0 WHERE id = ?")
           ->execute([$body['id']]);
        echo json_encode(['succes' => true]);
        exit;
    }

    // Logout
    if (str_ends_with($uri, '/auth/logout')) {
        AuthMiddleware::authentifier();
        http_response_code(200);
        echo json_encode(['succes' => true, 'message' => 'Déconnexion réussie']);
        exit;
    }

    // Connexion sans action (compatibilité)
    if (!$action) {
        $email    = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';

        if (!$email || !$password) {
            AuthMiddleware::erreur('Email et mot de passe requis', 400);
        }

        $stmt = $db->prepare(
            "SELECT * FROM utilisateurs WHERE email = ? AND actif = 1 LIMIT 1"
        );
        $stmt->execute([$email]);
        $utilisateur = $stmt->fetch();

        if (!$utilisateur || !password_verify($password, $utilisateur['mot_de_passe_hash'])) {
            AuthMiddleware::erreur('Email ou mot de passe incorrect', 401);
        }

        $payload = [
            'id'      => $utilisateur['id'],
            'email'   => $utilisateur['email'],
            'role'    => $utilisateur['role'],
            'nom'     => $utilisateur['nom_affichage'],
            'id_lien' => $utilisateur['id_lien'],
        ];

        $token = AuthMiddleware::genererToken($payload);

        $db->prepare("UPDATE utilisateurs SET dernier_login = NOW() WHERE id = ?")
           ->execute([$utilisateur['id']]);

        http_response_code(200);
        echo json_encode([
            'succes'      => true,
            'token'       => $token,
            'utilisateur' => [
                'id'      => $utilisateur['id'],
                'email'   => $utilisateur['email'],
                'role'    => $utilisateur['role'],
                'nom'     => $utilisateur['nom_affichage'],
                'id_lien' => $utilisateur['id_lien'],
            ]
        ]);
        exit;
    }
}

AuthMiddleware::erreur('Route non trouvée', 404);
<?php
// EduSchedule Pro — API Authentification

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

AuthMiddleware::configCORS();

$db     = (new Database())->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// POST /api/auth/login
if ($method === 'POST') {
    $body     = json_decode(file_get_contents('php://input'), true);
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

// POST /api/auth/logout
if ($method === 'POST' && str_ends_with($uri, '/auth/logout')) {
    AuthMiddleware::authentifier();
    http_response_code(200);
    echo json_encode(['succes' => true, 'message' => 'Déconnexion réussie']);
    exit;
}

// GET /api/auth/me
if ($method === 'GET' && str_ends_with($uri, '/auth/me')) {
    $user = AuthMiddleware::authentifier();
    echo json_encode(['succes' => true, 'utilisateur' => $user]);
    exit;
}

AuthMiddleware::erreur('Route non trouvée', 404);
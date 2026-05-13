<?php
// EduSchedule Pro — API Notifications

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

AuthMiddleware::configCORS();

$db             = (new Database())->getConnection();
$method         = $_SERVER['REQUEST_METHOD'];
$action         = $_GET['action'] ?? '';
$utilisateur    = AuthMiddleware::authentifier();
$idUtilisateur  = $utilisateur['id'];
$role           = $utilisateur['role'];

// ===== GET =====
if ($method === 'GET') {

    if ($action === 'liste') {
        $stmt = $db->prepare("
            SELECT id, type, message, lue, date_creation
            FROM notifications
            WHERE id_destinataire = ?
            ORDER BY date_creation DESC
            LIMIT 20
        ");
        $stmt->execute([$idUtilisateur]);
        echo json_encode(['succes' => true, 'data' => $stmt->fetchAll()]);
        exit;
    }

    if ($action === 'non_lues') {
        $stmt = $db->prepare("SELECT COUNT(*) as total FROM notifications WHERE id_destinataire = ? AND lue = 0");
        $stmt->execute([$idUtilisateur]);
        $row = $stmt->fetch();
        echo json_encode(['succes' => true, 'total' => (int)$row['total']]);
        exit;
    }
}

// ===== POST =====
if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);

    if ($action === 'marquer_lue') {
        $db->prepare("UPDATE notifications SET lue = 1 WHERE id = ? AND id_destinataire = ?")
           ->execute([$body['id'], $idUtilisateur]);
        echo json_encode(['succes' => true]);
        exit;
    }

    if ($action === 'marquer_toutes_lues') {
        $db->prepare("UPDATE notifications SET lue = 1 WHERE id_destinataire = ?")
           ->execute([$idUtilisateur]);
        echo json_encode(['succes' => true]);
        exit;
    }

    if ($action === 'creer') {
        $db->prepare("
            INSERT INTO notifications (id_destinataire, type, message, lue)
            VALUES (?, ?, ?, 0)
        ")->execute([
            $body['id_destinataire'],
            $body['type'],
            $body['message'],
        ]);
        echo json_encode(['succes' => true]);
        exit;
    }
}

AuthMiddleware::erreur('Route non trouvee', 404);
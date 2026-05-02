<?php
// EduSchedule Pro — Authentification JWT

require_once __DIR__ . '/../config/constants.php';

class AuthMiddleware {

    // Générer un token JWT
    public static function genererToken(array $payload): string {
        $header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload['iat'] = time();
        $payload['exp'] = time() + JWT_EXPIRE;
        $payloadEncode = base64_encode(json_encode($payload));
        $signature = base64_encode(hash_hmac('sha256', "$header.$payloadEncode", JWT_SECRET, true));
        return "$header.$payloadEncode.$signature";
    }

    // Vérifier un token JWT
    public static function verifierToken(string $token): array {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new Exception('Token invalide', 401);
        }
        [$header, $payload, $signature] = $parts;
        $signatureAttendue = base64_encode(
            hash_hmac('sha256', "$header.$payload", JWT_SECRET, true)
        );
        if (!hash_equals($signatureAttendue, $signature)) {
            throw new Exception('Signature invalide', 401);
        }
        $data = json_decode(base64_decode($payload), true);
        if (!$data || $data['exp'] < time()) {
            throw new Exception('Token expiré', 401);
        }
        return $data;
    }

    // Vérifier le token depuis les headers HTTP
    public static function authentifier(): array {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        if (!str_starts_with($authHeader, 'Bearer ')) {
            self::erreur('Token manquant', 401);
        }
        $token = substr($authHeader, 7);
        try {
            return self::verifierToken($token);
        } catch (Exception $e) {
            self::erreur($e->getMessage(), 401);
        }
    }

    // Vérifier le rôle de l'utilisateur
    public static function exigerRole(array $rolesAutorises): array {
        $utilisateur = self::authentifier();
        if (!in_array($utilisateur['role'], $rolesAutorises, true)) {
            self::erreur('Accès refusé', 403);
        }
        return $utilisateur;
    }

    // Configurer les headers CORS et JSON
    public static function configCORS(): void {
        header('Access-Control-Allow-Origin: ' . CORS_ORIGIN);
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Authorization, Content-Type');
        header('Content-Type: application/json; charset=UTF-8');
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }

    // Retourner une erreur JSON
    public static function erreur(string $message, int $code = 400): never {
        http_response_code($code);
        echo json_encode(['erreur' => $message]);
        exit;
    }
}
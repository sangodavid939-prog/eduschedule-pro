<?php
// EduSchedule Pro — Connexion à la base de données

require_once __DIR__ . '/constants.php';

class Database {
    private ?PDO $connection = null;

    public function getConnection(): PDO {
        if ($this->connection === null) {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];
            try {
                $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['erreur' => 'Erreur de connexion à la base de données']);
                exit;
            }
        }
        return $this->connection;
    }
}
<?php
// EduSchedule Pro — Configuration générale

// Base de données
define('DB_HOST', 'localhost');
define('DB_NAME', 'eduschedule_pro');
define('DB_USER', 'root');
define('DB_PASS', '');

// JWT - Sécurité
define('JWT_SECRET', 'eduschedule_secret_key_2025_isge');
define('JWT_EXPIRE', 86400); // 24 heures

// QR Code
define('QR_SECRET_KEY', 'eduschedule_qr_secret_2025');
define('QR_FENETRE_MINUTES', 15);
define('QR_ALERTE_MINUTES', 30);

// Application
define('APP_URL', 'http://localhost/eduschedule_pro/backend');
define('APP_ENV', 'development');

// CORS - autorise React à communiquer avec PHP
define('CORS_ORIGIN', 'http://localhost:3000');

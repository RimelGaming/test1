<?php
declare(strict_types=1);

/**
 * ThreadCraft V2 — Public Front Controller Entry Point
 * Shared cPanel / Apache routing with HTTP-only session, CSRF, and Admin Route Protection
 */

ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

session_set_cookie_params([
    'lifetime' => 86400,
    'path' => '/',
    'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
    'httponly' => true,
    'samesite' => 'Lax'
]);
session_start();

define('ROOT_PATH', dirname(__DIR__));
define('PUBLIC_PATH', __DIR__);

spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = ROOT_PATH . '/app/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';

    if (file_exists($file)) {
        require $file;
    }
});

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Enforce CSRF token on all state-mutating requests
if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true) && strpos($uri, '/api/webhooks/') !== 0) {
    $clientToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!hash_equals($_SESSION['csrf_token'], $clientToken)) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Invalid or missing CSRF token.']);
        exit;
    }
}

// Protect all /api/admin/* endpoints with strict server-side role & must_change_password checks
if (strpos($uri, '/api/admin/') === 0) {
    $sessionUser = $_SESSION['user'] ?? null;
    if (!$sessionUser || ($sessionUser['role'] ?? '') !== 'admin') {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Forbidden: Administrator privileges required.']);
        exit;
    }
    if (!empty($sessionUser['must_change_password'])) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode([
            'error' => 'PASSWORD_CHANGE_REQUIRED',
            'mustChangePassword' => true,
            'message' => 'Mandatory password update required before accessing administrator operations.'
        ]);
        exit;
    }
}

switch (true) {
    case $uri === '/' || $uri === '/home':
        header('Content-Type: text/html; charset=utf-8');
        echo "<!-- ThreadCraft V2 Server Rendered PHP Application -->";
        break;

    case $uri === '/api/health':
        header('Content-Type: application/json');
        echo json_encode(['status' => 'healthy', 'timestamp' => time()]);
        break;

    default:
        http_response_code(200);
        break;
}

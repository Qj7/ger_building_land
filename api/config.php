<?php
declare(strict_types=1);

const DATA_DIR = __DIR__ . '/../data';
const REQUESTS_FILE = DATA_DIR . '/requests.json';
const LOGIN_ATTEMPTS_FILE = DATA_DIR . '/login_attempts.json';
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_BLOCK_SECONDS = 900;

function init_storage(): void
{
    if (!is_dir(DATA_DIR)) {
        mkdir(DATA_DIR, 0775, true);
    }

    if (!file_exists(REQUESTS_FILE)) {
        file_put_contents(REQUESTS_FILE, json_encode([], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    if (!file_exists(LOGIN_ATTEMPTS_FILE)) {
        file_put_contents(LOGIN_ATTEMPTS_FILE, json_encode([], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }
}

function json_response(array $payload, int $statusCode = 200): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function load_requests(): array
{
    init_storage();
    $fp = fopen(REQUESTS_FILE, 'c+');
    if (!$fp) {
        return [];
    }

    flock($fp, LOCK_SH);
    $content = stream_get_contents($fp);
    flock($fp, LOCK_UN);
    fclose($fp);

    if ($content === false || trim($content) === '') {
        return [];
    }

    $data = json_decode($content, true);
    return is_array($data) ? $data : [];
}

function save_requests(array $requests): bool
{
    init_storage();
    $fp = fopen(REQUESTS_FILE, 'c+');
    if (!$fp) {
        return false;
    }

    flock($fp, LOCK_EX);
    ftruncate($fp, 0);
    rewind($fp);
    $ok = fwrite($fp, json_encode($requests, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) !== false;
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);

    return $ok;
}

function require_method(string $method): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== $method) {
        json_response(['ok' => false, 'error' => 'Method not allowed'], 405);
    }
}

function ensure_session_started(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
}

function is_admin_authenticated(): bool
{
    ensure_session_started();
    return !empty($_SESSION['admin_auth']) && $_SESSION['admin_auth'] === true;
}

/**
 * Reads a single environment-style value (hosting / FPM / CLI).
 */
function env_string(string $name): string
{
    $v = getenv($name);
    if ($v !== false && $v !== '') {
        return (string) $v;
    }
    if (isset($_SERVER[$name]) && (string) $_SERVER[$name] !== '') {
        return (string) $_SERVER[$name];
    }
    if (isset($_ENV[$name]) && (string) $_ENV[$name] !== '') {
        return (string) $_ENV[$name];
    }
    return '';
}

/**
 * Admin credentials: never hardcoded. Set via server env or api/env.local.php (gitignored).
 * GitHub: store ADMIN_LOGIN / ADMIN_PASSWORD as repository Actions secrets and inject at deploy.
 *
 * @return array{login: string, password: string}|null
 */
function admin_password_normalize(string $password): string
{
    $password = trim($password);
    if ($password === '') {
        return '';
    }
    if (mb_strlen($password) > 256) {
        $password = mb_substr($password, 0, 256);
    }
    return $password;
}

function get_admin_credentials(): ?array
{
    $login = sanitize_text(env_string('ADMIN_LOGIN'), 64);
    $password = admin_password_normalize(env_string('ADMIN_PASSWORD'));

    if ($login !== '' && $password !== '') {
        return ['login' => $login, 'password' => $password];
    }

    $localFile = __DIR__ . '/env.local.php';
    if (is_file($localFile)) {
        $local = require $localFile;
        if (is_array($local)) {
            $login = sanitize_text((string)($local['ADMIN_LOGIN'] ?? ''), 64);
            $password = admin_password_normalize((string)($local['ADMIN_PASSWORD'] ?? ''));
            if ($login !== '' && $password !== '') {
                return ['login' => $login, 'password' => $password];
            }
        }
    }

    return null;
}

function sanitize_text(string $value, int $maxLength = 1000): string
{
    $value = trim($value);
    if ($value === '') {
        return '';
    }

    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';
    if (mb_strlen($value) > $maxLength) {
        $value = mb_substr($value, 0, $maxLength);
    }
    return $value;
}

function sanitize_email(string $email): string
{
    $email = sanitize_text($email, 254);
    return filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : '';
}

function sanitize_phone(string $phone): string
{
    $phone = sanitize_text($phone, 40);
    $phone = preg_replace('/[^0-9+\-\s()]/', '', $phone) ?? '';
    return trim($phone);
}

function sanitize_id(string $id): string
{
    $id = sanitize_text($id, 64);
    return preg_replace('/[^a-zA-Z0-9\-_]/', '', $id) ?? '';
}

function sanitize_date_iso(string $date): string
{
    $date = sanitize_text($date, 10);
    return preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) ? $date : '';
}

function sanitize_slots(array $slots): array
{
    $allowed = ['7-11', '11-15', '15-19'];
    $out = [];
    foreach ($slots as $slot) {
        if (!is_string($slot)) {
            continue;
        }
        $slot = sanitize_text($slot, 10);
        if (in_array($slot, $allowed, true) && !in_array($slot, $out, true)) {
            $out[] = $slot;
        }
    }
    return $out;
}

function client_ip_key(): string
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    return preg_replace('/[^a-fA-F0-9:\.]/', '', $ip) ?: 'unknown';
}

function load_login_attempts(): array
{
    init_storage();
    $raw = file_get_contents(LOGIN_ATTEMPTS_FILE);
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function save_login_attempts(array $attempts): bool
{
    init_storage();
    return file_put_contents(
        LOGIN_ATTEMPTS_FILE,
        json_encode($attempts, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
    ) !== false;
}

function login_rate_limited(string $ip): bool
{
    $attempts = load_login_attempts();
    $entry = $attempts[$ip] ?? null;
    if (!is_array($entry)) {
        return false;
    }

    $blockedUntil = (int)($entry['blocked_until'] ?? 0);
    return $blockedUntil > time();
}

function register_failed_login(string $ip): void
{
    $attempts = load_login_attempts();
    $now = time();
    $entry = $attempts[$ip] ?? ['count' => 0, 'first_try_at' => $now, 'blocked_until' => 0];

    if (!is_array($entry)) {
        $entry = ['count' => 0, 'first_try_at' => $now, 'blocked_until' => 0];
    }

    $firstTryAt = (int)($entry['first_try_at'] ?? $now);
    if (($now - $firstTryAt) > LOGIN_BLOCK_SECONDS) {
        $entry = ['count' => 0, 'first_try_at' => $now, 'blocked_until' => 0];
    }

    $entry['count'] = ((int)($entry['count'] ?? 0)) + 1;
    if ($entry['count'] >= LOGIN_MAX_ATTEMPTS) {
        $entry['blocked_until'] = $now + LOGIN_BLOCK_SECONDS;
        $entry['count'] = 0;
        $entry['first_try_at'] = $now;
    }

    $attempts[$ip] = $entry;
    save_login_attempts($attempts);
}

function clear_failed_logins(string $ip): void
{
    $attempts = load_login_attempts();
    if (isset($attempts[$ip])) {
        unset($attempts[$ip]);
        save_login_attempts($attempts);
    }
}


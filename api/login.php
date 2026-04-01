<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

require_method('POST');

$body = read_json_body();
$login = sanitize_text((string)($body['login'] ?? ''), 64);
$password = sanitize_text((string)($body['password'] ?? ''), 128);
$ip = client_ip_key();

if (login_rate_limited($ip)) {
    json_response([
        'ok' => false,
        'authenticated' => false,
        'error' => 'Zu viele fehlgeschlagene Versuche. Bitte später erneut versuchen.'
    ], 429);
}

$creds = get_admin_credentials();
if ($creds === null) {
    json_response([
        'ok' => false,
        'authenticated' => false,
        'error' => 'Admin-Zugang ist nicht konfiguriert. Setzen Sie ADMIN_LOGIN und ADMIN_PASSWORD (Umgebungsvariablen) oder legen Sie api/env.local.php an (siehe env.local.example.php).'
    ], 503);
}

if ($login === $creds['login'] && hash_equals($creds['password'], $password)) {
    ensure_session_started();
    $_SESSION['admin_auth'] = true;
    clear_failed_logins($ip);
    json_response(['ok' => true, 'authenticated' => true]);
}

register_failed_login($ip);
json_response(['ok' => false, 'authenticated' => false, 'error' => 'Falscher Login oder Passwort.'], 401);


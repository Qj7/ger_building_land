<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    if (!is_admin_authenticated()) {
        json_response(['ok' => false, 'error' => 'Unauthorized'], 401);
    }

    $requests = load_requests();
    usort($requests, static function (array $a, array $b): int {
        return strcmp((string)($b['createdAt'] ?? ''), (string)($a['createdAt'] ?? ''));
    });

    json_response(['ok' => true, 'requests' => $requests]);
}

if ($method === 'POST') {
    $body = read_json_body();
    $type = sanitize_text((string)($body['type'] ?? ''), 16);

    if ($type !== 'contact' && $type !== 'calendar') {
        json_response(['ok' => false, 'error' => 'Invalid request type'], 400);
    }

    $item = [
        'id' => sanitize_id((string)($body['id'] ?? ('req-' . round(microtime(true) * 1000)))),
        'type' => $type,
        'name' => sanitize_text((string)($body['name'] ?? ''), 120),
        'email' => sanitize_email((string)($body['email'] ?? '')),
        'phone' => sanitize_phone((string)($body['phone'] ?? '')),
        'message' => sanitize_text((string)($body['message'] ?? ''), 2000),
        'date' => sanitize_date_iso((string)($body['date'] ?? '')),
        'slots' => sanitize_slots((array)($body['slots'] ?? [])),
        'formattedDate' => sanitize_text((string)($body['formattedDate'] ?? ''), 120),
        'slotsText' => sanitize_text((string)($body['slotsText'] ?? ''), 120),
        'createdAt' => sanitize_text((string)($body['createdAt'] ?? gmdate('c')), 64),
        'processed' => false
    ];

    if ($item['id'] === '') {
        $item['id'] = 'req-' . round(microtime(true) * 1000);
    }

    if ($type === 'contact') {
        if ($item['name'] === '') {
            json_response(['ok' => false, 'error' => 'Name is required'], 400);
        }
        if ($item['email'] === '') {
            json_response(['ok' => false, 'error' => 'Valid email is required'], 400);
        }
        if ($item['phone'] === '') {
            json_response(['ok' => false, 'error' => 'Phone is required'], 400);
        }
    }

    if ($type === 'calendar') {
        if ($item['date'] === '' || count($item['slots']) === 0) {
            json_response(['ok' => false, 'error' => 'Date and at least one slot are required'], 400);
        }
    }

    $requests = load_requests();
    $requests[] = $item;
    if (!save_requests($requests)) {
        json_response(['ok' => false, 'error' => 'Failed to save request'], 500);
    }

    json_response(['ok' => true, 'request' => $item], 201);
}

json_response(['ok' => false, 'error' => 'Method not allowed'], 405);


<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

require_method('POST');

if (!is_admin_authenticated()) {
    json_response(['ok' => false, 'error' => 'Unauthorized'], 401);
}

$body = read_json_body();
$id = sanitize_id((string)($body['id'] ?? ''));
if ($id === '') {
    json_response(['ok' => false, 'error' => 'ID is required'], 400);
}

$requests = load_requests();
$updated = false;

foreach ($requests as &$request) {
    if (($request['id'] ?? '') === $id) {
        $request['processed'] = true;
        $updated = true;
        break;
    }
}
unset($request);

if (!$updated) {
    json_response(['ok' => false, 'error' => 'Request not found'], 404);
}

if (!save_requests($requests)) {
    json_response(['ok' => false, 'error' => 'Failed to save changes'], 500);
}

json_response(['ok' => true]);


<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

require_method('GET');

json_response([
    'ok' => true,
    'authenticated' => is_admin_authenticated()
]);


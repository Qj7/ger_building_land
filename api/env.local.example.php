<?php
declare(strict_types=1);

/**
 * Copy to env.local.php on the server (never commit env.local.php).
 * Prefer environment variables ADMIN_LOGIN / ADMIN_PASSWORD from hosting or CI.
 *
 * GitHub: add repository Secrets Actions → ADMIN_LOGIN, ADMIN_PASSWORD
 * and inject at deploy (see IONOS_DEPLOY.md).
 */
return [
    'ADMIN_LOGIN' => '',
    'ADMIN_PASSWORD' => '',
];

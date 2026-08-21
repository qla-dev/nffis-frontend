<?php

declare(strict_types=1);

set_time_limit(0);
header('Content-Type: text/plain; charset=utf-8');
header('Cache-Control: no-store');
header('X-Accel-Buffering: no');

function respond(int $status, string $message): never
{
    http_response_code($status);
    echo $message."\n";
    exit;
}

function run(string $command, string $workingDirectory): int
{
    $process = proc_open($command, [
        0 => ['pipe', 'r'],
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w'],
    ], $pipes, $workingDirectory);

    if (! is_resource($process)) {
        echo "Unable to start command.\n";
        return 1;
    }

    fclose($pipes[0]);
    stream_set_blocking($pipes[1], false);
    stream_set_blocking($pipes[2], false);

    do {
        foreach ([1, 2] as $pipe) {
            while (($line = fgets($pipes[$pipe])) !== false) {
                echo $line;
                flush();
            }
        }

        $status = proc_get_status($process);
        usleep(100000);
    } while ($status['running']);

    foreach ([1, 2] as $pipe) {
        stream_get_contents($pipes[$pipe]);
        fclose($pipes[$pipe]);
    }

    $exitCode = $status['exitcode'];
    $closeCode = proc_close($process);

    return is_int($exitCode) && $exitCode >= 0 ? $exitCode : $closeCode;
}

$stateDirectory = (string) (getenv('NFFIS_FRONTEND_DEPLOY_STATE_DIR') ?: dirname(__DIR__).'/nffis-frontend-deploy-state');
if (! is_dir($stateDirectory) && ! mkdir($stateDirectory, 0700, true) && ! is_dir($stateDirectory)) {
    respond(500, 'Deployment state directory is not writable.');
}

$lockHandle = @fopen($stateDirectory.'/frontend.deploy.lock', 'c');
if ($lockHandle === false || ! flock($lockHandle, LOCK_EX | LOCK_NB)) {
    respond(409, 'A frontend deployment is already running.');
}

register_shutdown_function(static function () use ($lockHandle): void {
    flock($lockHandle, LOCK_UN);
    fclose($lockHandle);
});

$baseDirectory = __DIR__;
$branch = 'main';

foreach (['git'] as $binary) {
    $result = run('command -v '.escapeshellarg($binary).' >/dev/null 2>&1', $baseDirectory);
    if ($result !== 0) {
        respond(503, "Required command is unavailable: {$binary}");
    }
}

if (($_GET['check'] ?? '') === '1') {
    echo "Frontend deployment prerequisites are available.\n";

    foreach (['git --version'] as $command) {
        echo "> {$command}\n";

        if (run($command, $baseDirectory) !== 0) {
            respond(503, 'Frontend deployment prerequisite check failed.');
        }
    }

    echo "Prerequisite check completed. No deployment was run.\n";
    exit;
}

$commands = [
    // Allow a one-time manual redeploy.php update to bootstrap a cPanel server
    // that cannot run the older npm-based script. All other local changes block deployment.
    "git diff --quiet -- . ':(exclude)redeploy.php'",
    "git diff --cached --quiet -- . ':(exclude)redeploy.php'",
    'git fetch --prune origin',
    'git merge --ff-only '.escapeshellarg('origin/'.$branch),
];

foreach ($commands as $command) {
    echo "\n> {$command}\n";
    flush();

    if (run($command, $baseDirectory) !== 0) {
        respond(500, 'Frontend deployment failed.');
    }
}

if (! is_file($baseDirectory.'/dist/index.html')) {
    respond(500, 'Built frontend assets are missing. Build and commit dist/ before deploying.');
}

echo "\nFrontend deployment completed.\n";

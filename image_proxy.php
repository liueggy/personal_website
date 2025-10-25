<?php
// Simple image proxy + cache
// Usage: /image_proxy.php?url=https%3A%2F%2Fexample.com%2Fimage.jpg
// Caches to /uploads/covers/YYYYMM/<sha1>.<ext>

// ---- Config ----
$MAX_BYTES = 5 * 1024 * 1024; // 5MB limit
$TIMEOUT = 8; // seconds
$CACHE_TTL = 30 * 24 * 3600; // 30 days
$UPLOAD_BASE = __DIR__ . '/uploads/covers';
$ALLOWED_CONTENT_TYPES = [
    'image/jpeg' => 'jpg',
    'image/jpg'  => 'jpg',
    'image/pjpeg'=> 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
    'image/gif'  => 'gif',
    // 'image/svg+xml' => 'svg', // disabled for safety
];

function bad_request($code = 400, $msg = 'Bad Request') {
    http_response_code($code);
    header('Content-Type: text/plain; charset=utf-8');
    echo $msg;
    exit;
}

function is_private_ip($ip) {
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
        $long = ip2long($ip);
        $private = [
            ['0.0.0.0','2.255.255.255'],      // software / current network
            ['10.0.0.0','10.255.255.255'],    // class A private
            ['127.0.0.0','127.255.255.255'],  // loopback
            ['169.254.0.0','169.254.255.255'],// link-local
            ['172.16.0.0','172.31.255.255'],  // class B private
            ['192.0.2.0','192.0.2.255'],      // TEST-NET-1
            ['192.168.0.0','192.168.255.255'],// class C private
            ['198.18.0.0','198.19.255.255'],  // network testing
            ['224.0.0.0','239.255.255.255'],  // multicast
            ['240.0.0.0','255.255.255.254'],  // reserved
        ];
        foreach ($private as [$start, $end]) {
            if ($long >= ip2long($start) && $long <= ip2long($end)) return true;
        }
    }
    // treat IPv6 as private for simplicity in this proxy
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) return true;
    return false;
}

$url = isset($_GET['url']) ? trim($_GET['url']) : '';
if (!$url) bad_request(400, 'Missing url');

if (!filter_var($url, FILTER_VALIDATE_URL)) bad_request(400, 'Invalid url');
$parts = parse_url($url);
if (!isset($parts['scheme']) || !in_array(strtolower($parts['scheme']), ['http','https'])) {
    bad_request(400, 'Only http/https allowed');
}

// avoid proxying self to prevent loops
$host = $parts['host'] ?? '';
if (!$host) bad_request(400, 'Invalid host');
$serverHost = $_SERVER['HTTP_HOST'] ?? '';
if ($serverHost && stripos($host, $serverHost) !== false) {
    bad_request(400, 'Loop blocked');
}

// basic SSRF guard: resolve and block private ranges
$resolved = @gethostbynamel($host);
if ($resolved && count($resolved) > 0) {
    foreach ($resolved as $ip) {
        if (is_private_ip($ip)) bad_request(400, 'Private address blocked');
    }
}

$hash = sha1($url);
$ym = date('Ym');
$dir = $UPLOAD_BASE . '/' . $ym;
if (!is_dir($dir)) {
    @mkdir($dir, 0755, true);
}

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_CONNECTTIMEOUT => $TIMEOUT,
    CURLOPT_TIMEOUT => $TIMEOUT,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
    CURLOPT_USERAGENT => 'Mozilla/5.0 (ImageProxy) LiuEggySite/1.0',
    CURLOPT_REFERER => '', // no-referrer
    CURLOPT_HEADER => true,
]);

$downloaded = 0;
curl_setopt($ch, CURLOPT_NOPROGRESS, false);
curl_setopt($ch, CURLOPT_PROGRESSFUNCTION, function($resource, $dltotal, $dlnow) use (&$downloaded, $MAX_BYTES) {
    $downloaded = $dlnow;
    return ($dlnow > $MAX_BYTES) ? 1 : 0; // abort if exceeds limit
});

$response = curl_exec($ch);
if ($response === false) {
    bad_request(502, 'Fetch failed');
}

$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$headersRaw = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);

$httpCode = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
curl_close($ch);

if ($httpCode < 200 || $httpCode >= 300) {
    bad_request(502, 'Upstream error');
}

// normalize content type (strip charset)
if ($contentType) {
    $contentType = strtolower(trim(explode(';', $contentType)[0]));
}

if (!$contentType || !isset($ALLOWED_CONTENT_TYPES[$contentType])) {
    bad_request(415, 'Unsupported content-type');
}

if (strlen($body) === 0) {
    bad_request(502, 'Empty body');
}

$ext = $ALLOWED_CONTENT_TYPES[$contentType];
$filePath = "$dir/$hash.$ext";

// Save if not cached or outdated/empty
if (!file_exists($filePath) || filesize($filePath) === 0) {
    @file_put_contents($filePath, $body);
}

// Serve from cache
if (!file_exists($filePath)) {
    bad_request(500, 'Cache write failed');
}

// If cache is older than TTL, try refresh asynchronously (best-effort)
$mtime = @filemtime($filePath) ?: time();
if (time() - $mtime > $CACHE_TTL) {
    @touch($filePath); // simple marker; full refresh can be added via cron
}

// Output
header('Content-Type: ' . $contentType);
header('Cache-Control: public, max-age=2592000'); // 30 days
header('Content-Length: ' . filesize($filePath));
readfile($filePath);

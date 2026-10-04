<?php
// api/document/index.php
require_once '../db.php';
require_once '../auth_middleware.php';

$user = authenticate();

$fileId = isset($_GET['file']) ? $_GET['file'] : null;

if (!$fileId) {
    http_response_code(400);
    echo json_encode(["message" => "File identifier is required."]);
    exit();
}

// Basic security checks against path traversal
if (strpos($fileId, '..') !== false || strpos($fileId, '/') !== false) {
    http_response_code(400);
    echo json_encode(["message" => "Invalid file identifier."]);
    exit();
}

$isAdmin = ($user['role'] === 'admin');
$hasAccess = $isAdmin;

// If not admin, verify ownership
if (!$isAdmin) {
    // Check if it's the user's KYC doc
    $stmt = $conn->prepare("SELECT id FROM users WHERE id = ? AND (license_front_url = ? OR license_back_url = ? OR selfie_url = ?)");
    $stmt->execute([$user['id'], $fileId, $fileId, $fileId]);
    if ($stmt->fetch()) {
        $hasAccess = true;
    } else {
        // Check if it's a vehicle doc for a vehicle they own
        $v_stmt = $conn->prepare("SELECT id FROM vehicles WHERE owner_id = ? AND (doc_rc_url = ? OR doc_insurance_url = ?)");
        $v_stmt->execute([$user['id'], $fileId, $fileId]);
        if ($v_stmt->fetch()) {
            $hasAccess = true;
        }
    }
}

if (!$hasAccess) {
    http_response_code(403);
    echo json_encode(["message" => "Forbidden."]);
    exit();
}

$filepath = __DIR__ . '/../../.private_kyc/' . $fileId;

if (!file_exists($filepath)) {
    http_response_code(404);
    echo json_encode(["message" => "File not found."]);
    exit();
}

$mime = mime_content_type($filepath);
header('Content-Type: ' . $mime);
header('Content-Length: ' . filesize($filepath));
readfile($filepath);
exit();
?>

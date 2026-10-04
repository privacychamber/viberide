<?php
// api/admin/users.php
require_once '../db.php';
require_once '../auth_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];
$admin = requireRole('admin');

if ($method === 'PATCH' || $method === 'PUT') {
    if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
        http_response_code(400);
        echo json_encode(["message" => "User ID is required."]);
        exit();
    }
    
    $userId = (int)$_GET['id'];
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!$data) {
        http_response_code(400);
        echo json_encode(["message" => "Invalid JSON payload."]);
        exit();
    }

    $updates = [];
    $params = [];

    // Handle KYC action
    if (isset($data['action'])) {
        if ($data['action'] === 'verify') {
            $updates[] = "license_status = 'verified'";
            $updates[] = "verified = 1";
        } elseif ($data['action'] === 'reject') {
            $updates[] = "license_status = 'rejected'";
            $updates[] = "verified = 0";
        }
    }

    // Handle Fraud Flag
    if (isset($data['flagged'])) {
        $updates[] = "flagged = ?";
        $params[] = $data['flagged'] ? 1 : 0;
    }

    // Handle Suspension
    if (isset($data['suspended'])) {
        if ($userId === (int)$admin['id']) {
            http_response_code(400);
            echo json_encode(["message" => "You cannot suspend your own account."]);
            exit();
        }
        $updates[] = "suspended = ?";
        $params[] = $data['suspended'] ? 1 : 0;
    }

    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(["message" => "No valid action provided."]);
        exit();
    }

    $params[] = $userId;
    
    $query = "UPDATE users SET " . implode(", ", $updates) . " WHERE id = ?";
    $stmt = $conn->prepare($query);
    
    if ($stmt->execute($params)) {
        http_response_code(200);
        echo json_encode(["message" => "User updated successfully."]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Failed to update user."]);
    }

} else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed."]);
}
?>

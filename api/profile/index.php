<?php
// api/profile/index.php
require_once '../db.php';
require_once '../auth_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = authenticate(); // Require authentication

if ($method === 'GET') {
    // Get full user profile
    $query = "SELECT id, name, email, phone, role, license_front_url, license_back_url, license_status, selfie_url, verified, email_verified, flagged, created_at FROM users WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->execute([$user['id']]);
    
    if ($stmt->rowCount() > 0) {
        $profile = $stmt->fetch();
        http_response_code(200);
        echo json_encode($profile);
    } else {
        http_response_code(404);
        echo json_encode(["message" => "User not found."]);
    }
} 
elseif ($method === 'PUT') {
    // Update profile
    $data = json_decode(file_get_contents("php://input"));
    
    // Allow updating specific fields safely
    $updates = [];
    $params = [];
    
    if (isset($data->name)) { $updates[] = "name = ?"; $params[] = $data->name; }
    if (isset($data->email)) { $updates[] = "email = ?"; $params[] = $data->email; }
    
    if (count($updates) > 0) {
        $params[] = $user['id']; // For the WHERE clause
        $query = "UPDATE users SET " . implode(", ", $updates) . " WHERE id = ?";
        
        $stmt = $conn->prepare($query);
        if ($stmt->execute($params)) {
            http_response_code(200);
            echo json_encode(["message" => "Profile updated successfully."]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Failed to update profile."]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "No valid fields provided for update."]);
    }
}
else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed."]);
}
?>

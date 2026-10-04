<?php
// api/owner/activate.php
require_once '../db.php';
require_once '../auth_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = authenticate(); 

if ($method === 'POST') {
    if ($user['role'] === 'renter') {
        $query = "UPDATE users SET role = 'owner' WHERE id = ?";
        $stmt = $conn->prepare($query);
        
        if ($stmt->execute([$user['id']])) {
            http_response_code(200);
            echo json_encode(["message" => "Successfully activated host account."]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Failed to update role."]);
        }
    } else {
        // Already owner or admin
        http_response_code(200);
        echo json_encode(["message" => "User is already an owner or admin."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed."]);
}
?>

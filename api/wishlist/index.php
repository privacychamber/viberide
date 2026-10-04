<?php
// api/wishlist/index.php
require_once '../db.php';
require_once '../auth_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = authenticate();

if ($method === 'POST') {
    $vehicle_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    if (!$vehicle_id) {
        http_response_code(400);
        echo json_encode(["message" => "Vehicle ID is required."]);
        exit();
    }
    
    // Check if vehicle exists
    $v_stmt = $conn->prepare("SELECT id FROM vehicles WHERE id = ?");
    $v_stmt->execute([$vehicle_id]);
    if ($v_stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(["message" => "Vehicle not found."]);
        exit();
    }
    
    // Check if it's already in wishlist
    $w_stmt = $conn->prepare("SELECT user_id FROM wishlists WHERE user_id = ? AND vehicle_id = ?");
    $w_stmt->execute([$user['id'], $vehicle_id]);
    $exists = $w_stmt->rowCount() > 0;
    
    if ($exists) {
        // Remove from wishlist
        $d_stmt = $conn->prepare("DELETE FROM wishlists WHERE user_id = ? AND vehicle_id = ?");
        if ($d_stmt->execute([$user['id'], $vehicle_id])) {
            http_response_code(200);
            echo json_encode(["message" => "Removed from wishlist.", "isSaved" => false]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Failed to remove from wishlist."]);
        }
    } else {
        // Add to wishlist
        $i_stmt = $conn->prepare("INSERT INTO wishlists (user_id, vehicle_id) VALUES (?, ?)");
        if ($i_stmt->execute([$user['id'], $vehicle_id])) {
            http_response_code(201);
            echo json_encode(["message" => "Added to wishlist.", "isSaved" => true]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Failed to add to wishlist."]);
        }
    }
} else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed."]);
}
?>

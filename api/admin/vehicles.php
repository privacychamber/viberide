<?php
// api/admin/vehicles.php
require_once '../db.php';
require_once '../auth_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];
$admin = requireRole('admin');

$vehicle_id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if (!$vehicle_id) {
    http_response_code(400);
    echo json_encode(["message" => "Vehicle ID is required."]);
    exit();
}

if ($method === 'PATCH') {
    $data = json_decode(file_get_contents("php://input"));
    if (!$data) {
        http_response_code(400);
        echo json_encode(["message" => "Invalid JSON payload."]);
        exit();
    }

    $updates = [];
    $params = [];

    if (isset($data->status)) {
        if (!in_array($data->status, ['pending', 'approved', 'rejected'])) {
            http_response_code(400);
            echo json_encode(["message" => "Invalid status value."]);
            exit();
        }
        $updates[] = "status = ?";
        $params[] = $data->status;
    }

    if (isset($data->featured)) {
        $updates[] = "featured = ?";
        $params[] = $data->featured ? 1 : 0;
    }

    if (isset($data->flagged)) {
        $updates[] = "flagged = ?";
        $params[] = $data->flagged ? 1 : 0;
    }

    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(["message" => "No valid update fields provided."]);
        exit();
    }

    $params[] = $vehicle_id;
    $query = "UPDATE vehicles SET " . implode(", ", $updates) . " WHERE id = ?";
    
    $stmt = $conn->prepare($query);
    if ($stmt->execute($params)) {
        http_response_code(200);
        echo json_encode(["message" => "Vehicle updated successfully."]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Failed to update vehicle."]);
    }
} 
elseif ($method === 'DELETE') {
    // Check if the vehicle has existing bookings before deleting to prevent unsafe CASCADE delete
    $b_stmt = $conn->prepare("SELECT COUNT(*) as booking_count FROM bookings WHERE vehicle_id = ?");
    $b_stmt->execute([$vehicle_id]);
    $result = $b_stmt->fetch(PDO::FETCH_ASSOC);

    if ($result && $result['booking_count'] > 0) {
        http_response_code(409); // Conflict
        echo json_encode(["message" => "Cannot delete vehicle because it has existing bookings. Please reject or flag it instead to preserve booking history."]);
        exit();
    }

    $stmt = $conn->prepare("DELETE FROM vehicles WHERE id = ?");
    if ($stmt->execute([$vehicle_id])) {
        if ($stmt->rowCount() > 0) {
            http_response_code(200);
            echo json_encode(["message" => "Vehicle deleted successfully."]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Vehicle not found."]);
        }
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Failed to delete vehicle."]);
    }
} 
else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed."]);
}
?>

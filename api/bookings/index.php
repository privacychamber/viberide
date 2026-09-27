<?php
// api/bookings/index.php
require_once '../db.php';
require_once '../auth_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = authenticate(); // Require authentication for any booking action

if ($method === 'GET') {
    // List bookings for the authenticated user
    $query = "SELECT b.*, v.title as vehicle_title, v.images FROM bookings b 
              JOIN vehicles v ON b.vehicle_id = v.id 
              WHERE b.user_id = ?";
              
    // If owner, fetch bookings for their vehicles
    if ($user['role'] === 'owner') {
        $query = "SELECT b.*, v.title as vehicle_title, u.name as renter_name FROM bookings b 
                  JOIN vehicles v ON b.vehicle_id = v.id 
                  JOIN users u ON b.user_id = u.id
                  WHERE v.owner_id = ?";
    }

    $stmt = $conn->prepare($query);
    $stmt->execute([$user['id']]);
    $bookings = $stmt->fetchAll();
    
    foreach ($bookings as &$b) {
        if(isset($b['images'])) {
            $b['images'] = json_decode($b['images'], true);
        }
    }
    
    http_response_code(200);
    echo json_encode($bookings);
} 
elseif ($method === 'POST') {
    // Create booking
    $data = json_decode(file_get_contents("php://input"));
    
    if (!empty($data->vehicle_id) && !empty($data->from_date) && !empty($data->to_date) && !empty($data->total_price)) {
        
        // Basic conflict check
        $conflict_query = "SELECT id FROM bookings WHERE vehicle_id = ? AND status IN ('pending', 'approved') AND ((from_date <= ? AND to_date >= ?) OR (from_date <= ? AND to_date >= ?))";
        $c_stmt = $conn->prepare($conflict_query);
        $c_stmt->execute([$data->vehicle_id, $data->to_date, $data->from_date, $data->from_date, $data->to_date]);
        
        if ($c_stmt->rowCount() > 0) {
            http_response_code(409);
            echo json_encode(["message" => "Vehicle is already booked for these dates."]);
            exit();
        }
        
        $query = "INSERT INTO bookings (vehicle_id, user_id, from_date, to_date, total_price) VALUES (?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($query);
        
        if ($stmt->execute([
            $data->vehicle_id,
            $user['id'],
            $data->from_date,
            $data->to_date,
            $data->total_price
        ])) {
            http_response_code(201);
            echo json_encode(["message" => "Booking created successfully.", "id" => $conn->lastInsertId()]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Unable to create booking."]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "Incomplete booking data."]);
    }
}
else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed."]);
}
?>

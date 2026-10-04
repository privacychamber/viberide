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
    
    if (!empty($data->vehicleId) && !empty($data->fromDate) && !empty($data->toDate)) {
        
        $from = new DateTime($data->fromDate);
        $to = new DateTime($data->toDate);
        
        if ($from >= $to) {
            http_response_code(400);
            echo json_encode(["message" => "Dropoff date must be after pickup date."]);
            exit();
        }
        
        $days = $from->diff($to)->days + 1; // inclusive calculation
        
        // Check vehicle validity and get price
        $v_query = "SELECT id, price_per_day, status, availability FROM vehicles WHERE id = ?";
        $v_stmt = $conn->prepare($v_query);
        $v_stmt->execute([$data->vehicleId]);
        $vehicle = $v_stmt->fetch();
        
        if (!$vehicle || (int)$vehicle['availability'] !== 1 || $vehicle['status'] !== 'approved') {
            http_response_code(400);
            echo json_encode(["message" => "Vehicle is not available for booking."]);
            exit();
        }
        
        $total_price = $days * (float)$vehicle['price_per_day'];
        
        // Basic conflict check
        $conflict_query = "SELECT id FROM bookings WHERE vehicle_id = ? AND status IN ('pending', 'approved') AND ((from_date <= ? AND to_date >= ?) OR (from_date <= ? AND to_date >= ?))";
        $c_stmt = $conn->prepare($conflict_query);
        $c_stmt->execute([$data->vehicleId, $data->toDate, $data->fromDate, $data->fromDate, $data->toDate]);
        
        if ($c_stmt->rowCount() > 0) {
            http_response_code(409);
            echo json_encode(["message" => "Vehicle is already booked for these dates."]);
            exit();
        }
        
        $query = "INSERT INTO bookings (vehicle_id, user_id, from_date, to_date, total_price) VALUES (?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($query);
        
        if ($stmt->execute([
            $data->vehicleId,
            $user['id'],
            $data->fromDate,
            $data->toDate,
            $total_price
        ])) {
            http_response_code(201);
            
            // Format for frontend response
            $booking_id = $conn->lastInsertId();
            $b_res = [
                "_id" => $booking_id,
                "status" => "pending"
            ];
            
            echo json_encode(["message" => "Booking created successfully.", "id" => $booking_id, "booking" => $b_res]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Unable to create booking."]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "Incomplete booking data."]);
    }
}
elseif ($method === 'PATCH') {
    $booking_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    if (!$booking_id) {
        http_response_code(400);
        echo json_encode(["message" => "Booking ID is required."]);
        exit();
    }
    
    $data = json_decode(file_get_contents("php://input"));
    
    if (empty($data->status) || $data->status !== 'cancelled') {
        http_response_code(400);
        echo json_encode(["message" => "Renters can only cancel bookings."]);
        exit();
    }
    
    $check_query = "SELECT status FROM bookings WHERE id = ? AND user_id = ?";
    $c_stmt = $conn->prepare($check_query);
    $c_stmt->execute([$booking_id, $user['id']]);
    $booking = $c_stmt->fetch();
    
    if (!$booking) {
        http_response_code(403);
        echo json_encode(["message" => "Forbidden or booking not found."]);
        exit();
    }
    
    if (!in_array($booking['status'], ['pending', 'approved'])) {
        http_response_code(400);
        echo json_encode(["message" => "Cannot cancel a booking that is already " . $booking['status'] . "."]);
        exit();
    }
    
    $update_query = "UPDATE bookings SET status = 'cancelled' WHERE id = ?";
    $u_stmt = $conn->prepare($update_query);
    
    if ($u_stmt->execute([$booking_id])) {
        http_response_code(200);
        echo json_encode(["message" => "Booking cancelled successfully.", "status" => "cancelled"]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Failed to cancel booking."]);
    }
}
else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed."]);
}
?>

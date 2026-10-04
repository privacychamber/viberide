<?php
// api/owner/bookings.php
require_once '../db.php';
require_once '../auth_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = requireRole('owner'); // Also allows admin

if ($method === 'PATCH') {
    $booking_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    if (!$booking_id) {
        http_response_code(400);
        echo json_encode(["message" => "Booking ID is required."]);
        exit();
    }
    
    $data = json_decode(file_get_contents("php://input"));
    
    if (empty($data->action) && empty($data->status)) {
        http_response_code(400);
        echo json_encode(["message" => "Invalid action or status. Must be provided."]);
        exit();
    }
    
    $action_val = isset($data->action) ? $data->action : (isset($data->status) ? $data->status : '');
    
    // Support both { action: "approve" } and { status: "approved" }
    if ($action_val === 'approve') $action_val = 'approved';
    if ($action_val === 'reject') $action_val = 'rejected';
    if ($action_val === 'cancel') $action_val = 'cancelled';
    if ($action_val === 'complete') $action_val = 'completed';
    
    if (!in_array($action_val, ['approved', 'rejected', 'cancelled', 'completed'])) {
         http_response_code(400);
         echo json_encode(["message" => "Invalid status. Must be 'approved', 'rejected', 'cancelled', or 'completed'."]);
         exit();
    }
    
    // Security Check: Ensure booking belongs to a vehicle owned by this user
    $check_query = "
        SELECT b.id, b.status 
        FROM bookings b
        JOIN vehicles v ON b.vehicle_id = v.id
        WHERE b.id = ? AND v.owner_id = ?
    ";
    $c_stmt = $conn->prepare($check_query);
    $c_stmt->execute([$booking_id, $user['id']]);
    $booking = $c_stmt->fetch();
    
    if (!$booking) {
        http_response_code(403);
        echo json_encode(["message" => "Forbidden or booking not found."]);
        exit();
    }
    
    // Lifecycle validation
    if ($booking['status'] === 'pending' && !in_array($action_val, ['approved', 'rejected', 'cancelled'])) {
        http_response_code(400);
        echo json_encode(["message" => "Pending bookings can only be approved, rejected, or cancelled."]);
        exit();
    }
    
    if ($booking['status'] === 'approved' && !in_array($action_val, ['completed', 'cancelled'])) {
        http_response_code(400);
        echo json_encode(["message" => "Approved bookings can only be completed or cancelled."]);
        exit();
    }
    
    if (in_array($booking['status'], ['rejected', 'cancelled', 'completed'])) {
        http_response_code(400);
        echo json_encode(["message" => "Cannot modify a booking that is already " . $booking['status'] . "."]);
        exit();
    }
    
    $new_status = $action_val;
    
    $update_query = "UPDATE bookings SET status = ? WHERE id = ?";
    $u_stmt = $conn->prepare($update_query);
    
    if ($u_stmt->execute([$new_status, $booking_id])) {
        http_response_code(200);
        echo json_encode(["message" => "Booking updated successfully.", "status" => $new_status]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Failed to update booking."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed."]);
}
?>

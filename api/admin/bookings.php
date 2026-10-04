<?php
require_once '../db.php';
require_once '../auth_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];
$admin = requireRole('admin'); // Only admins allowed

if ($method === 'GET') {
    $stmt = $conn->query("
        SELECT 
            b.id, b.vehicle_id, b.user_id, b.from_date, b.to_date, b.total_price, b.status, b.created_at,
            u.name AS renter_name, u.phone AS renter_phone, u.email AS renter_email,
            v.title AS vehicle_title,
            o.name AS owner_name, o.phone AS owner_phone
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        JOIN vehicles v ON b.vehicle_id = v.id
        JOIN users o ON v.owner_id = o.id
        ORDER BY b.created_at DESC
    ");
    $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $response = array_map(function($b) {
        return [
            'id' => (int)$b['id'],
            'vehicle_id' => (int)$b['vehicle_id'],
            'user_id' => (int)$b['user_id'],
            'fromDate' => $b['from_date'],
            'toDate' => $b['to_date'],
            'totalPrice' => (float)$b['total_price'],
            'status' => $b['status'],
            'createdAt' => $b['created_at'],
            'renter' => [
                'name' => $b['renter_name'],
                'phone' => $b['renter_phone'],
                'email' => $b['renter_email']
            ],
            'vehicle' => [
                'title' => $b['vehicle_title'],
                'ownerName' => $b['owner_name'],
                'ownerPhone' => $b['owner_phone']
            ]
        ];
    }, $bookings);
    
    http_response_code(200);
    header('Content-Type: application/json');
    echo json_encode($response);
    exit();
}

if ($method === 'PATCH') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(["message" => "Invalid booking ID."]);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['status'])) {
        http_response_code(400);
        echo json_encode(["message" => "Status is required."]);
        exit();
    }
    
    $newStatus = $input['status'];
    
    // Validate target status
    $allowedStatuses = ['cancelled', 'approved', 'rejected', 'completed', 'pending'];
    if (!in_array($newStatus, $allowedStatuses)) {
        http_response_code(400);
        echo json_encode(["message" => "Invalid status provided."]);
        exit();
    }
    
    // Fetch current status
    $stmt = $conn->prepare("SELECT status FROM bookings WHERE id = ?");
    $stmt->execute([$id]);
    $booking = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$booking) {
        http_response_code(404);
        echo json_encode(["message" => "Booking not found."]);
        exit();
    }
    
    $currentStatus = $booking['status'];
    
    // Safe transition enforcement
    if ($currentStatus === 'completed' && $newStatus !== 'completed') {
        http_response_code(400);
        echo json_encode(["message" => "Cannot modify a completed booking."]);
        exit();
    }
    
    if ($currentStatus === 'cancelled' && $newStatus !== 'cancelled') {
        http_response_code(400);
        echo json_encode(["message" => "Cannot revive a cancelled booking."]);
        exit();
    }
    
    // Update status
    $upStmt = $conn->prepare("UPDATE bookings SET status = ? WHERE id = ?");
    $upStmt->execute([$newStatus, $id]);
    
    http_response_code(200);
    echo json_encode(["message" => "Booking status updated successfully.", "status" => $newStatus]);
    exit();
}

http_response_code(405);
echo json_encode(["message" => "Method not allowed."]);
?>

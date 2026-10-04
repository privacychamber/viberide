<?php
// api/owner/index.php
require_once '../db.php';
require_once '../auth_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = requireRole('owner'); // Also allows admin

if ($method === 'GET') {
    // 1. Fetch Owner's Vehicles
    $v_query = "SELECT * FROM vehicles WHERE owner_id = ?";
    $v_stmt = $conn->prepare($v_query);
    $v_stmt->execute([$user['id']]);
    $vehicles = $v_stmt->fetchAll();
    
    foreach ($vehicles as &$v) {
        $v['images'] = $v['images'] ? json_decode($v['images'], true) : [];
        $v['blockedDates'] = $v['blocked_dates'] ? json_decode($v['blocked_dates'], true) : [];
        // Map keys for frontend
        $v['_id'] = $v['id'];
        $v['pricePerDay'] = (int)$v['price_per_day'];
        $v['location'] = [
            'area' => $v['location_area'],
            'city' => $v['location_city'],
            'state' => $v['location_state'],
            'country' => $v['location_country']
        ];
    }
    
    // 2. Fetch Bookings for Owner's Vehicles
    $b_query = "
        SELECT b.*, v.title as vehicle_title, u.name as renter_name, u.phone as renter_phone 
        FROM bookings b 
        JOIN vehicles v ON b.vehicle_id = v.id 
        JOIN users u ON b.user_id = u.id
        WHERE v.owner_id = ?
        ORDER BY b.created_at DESC
    ";
    $b_stmt = $conn->prepare($b_query);
    $b_stmt->execute([$user['id']]);
    $bookings_raw = $b_stmt->fetchAll();
    
    $bookings = [];
    $earnings = 0;
    
    foreach ($bookings_raw as $b) {
        if ($b['status'] === 'approved' || $b['status'] === 'completed') {
            $earnings += (float)$b['total_price'];
        }
        
        $bookings[] = [
            '_id' => $b['id'],
            'fromDate' => $b['from_date'],
            'toDate' => $b['to_date'],
            'totalPrice' => (int)$b['total_price'],
            'status' => $b['status'],
            'createdAt' => $b['created_at'],
            'vehicle' => [
                'title' => $b['vehicle_title']
            ],
            'user' => [
                'name' => $b['renter_name'],
                'phone' => $b['renter_phone']
            ]
        ];
    }
    
    http_response_code(200);
    echo json_encode([
        "vehicles" => $vehicles,
        "bookings" => $bookings,
        "earnings" => $earnings
    ]);
} else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed."]);
}
?>

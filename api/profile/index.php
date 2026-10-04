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
        function formatDocUrl($id) {
            if (!$id) return null;
            if (strpos($id, 'http') === 0 || strpos($id, '/uploads/') === 0) return $id;
            return '/api/document/index.php?file=' . urlencode($id);
        }

        // Map to frontend expectations
        $formattedUser = [
            'id' => $profile['id'],
            'name' => $profile['name'],
            'email' => $profile['email'],
            'phone' => $profile['phone'],
            'role' => $profile['role'],
            'verified' => (bool)$profile['verified'],
            'email_verified' => (bool)$profile['email_verified'],
            'flagged' => (bool)$profile['flagged'],
            'created_at' => $profile['created_at'],
            'license' => [
                'status' => $profile['license_status'],
                'frontUrl' => formatDocUrl($profile['license_front_url']),
                'backUrl' => formatDocUrl($profile['license_back_url']),
                'selfieUrl' => formatDocUrl($profile['selfie_url'])
            ],
            'wishlist' => []
        ];
        
        // Fetch wishlist items
        $w_query = "SELECT v.* FROM wishlists w JOIN vehicles v ON w.vehicle_id = v.id WHERE w.user_id = ?";
        $w_stmt = $conn->prepare($w_query);
        $w_stmt->execute([$user['id']]);
        $wishlistItems = $w_stmt->fetchAll();
        
        foreach ($wishlistItems as $v) {
            $formattedUser['wishlist'][] = [
                '_id' => $v['id'],
                'title' => $v['title'],
                'type' => $v['type'],
                'brand' => $v['brand'],
                'model' => $v['model'],
                'pricePerDay' => (int)$v['price_per_day'],
                'location' => [
                    'area' => $v['location_area'],
                    'city' => $v['location_city'],
                    'state' => $v['location_state'],
                    'country' => $v['location_country']
                ],
                'images' => $v['images'] ? json_decode($v['images'], true) : [],
                'specs' => [
                    'engineCc' => $v['spec_engine_cc'],
                    'fuelType' => $v['spec_fuel_type'],
                    'transmission' => $v['spec_transmission'],
                    'seatingCapacity' => $v['spec_seating_capacity'],
                    'deliveryAvailable' => (bool)$v['spec_delivery_available']
                ]
            ];
        }
        
        // Let's also fetch bookings for this user since the frontend expects it here
        $b_query = "SELECT b.*, v.title, v.brand, v.model, v.location_city as location FROM bookings b JOIN vehicles v ON b.vehicle_id = v.id WHERE b.user_id = ?";
        $b_stmt = $conn->prepare($b_query);
        $b_stmt->execute([$user['id']]);
        $bookings = $b_stmt->fetchAll();
        
        // Map bookings to frontend expectation camelCase
        $formattedBookings = [];
        foreach ($bookings as $b) {
            $formattedBookings[] = [
                '_id' => $b['id'],
                'fromDate' => $b['from_date'],
                'toDate' => $b['to_date'],
                'totalPrice' => $b['total_price'],
                'status' => $b['status'],
                'createdAt' => $b['created_at'],
                'vehicle' => [
                    'title' => $b['title'],
                    'brand' => $b['brand'],
                    'model' => $b['model'],
                    'location' => $b['location']
                ]
            ];
        }
        
        http_response_code(200);
        echo json_encode([
            "user" => $formattedUser,
            "bookings" => $formattedBookings
        ]);
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

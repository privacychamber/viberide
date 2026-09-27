<?php
// api/vehicles/index.php
require_once '../db.php';
require_once '../auth_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // List vehicles (can add filters here)
    $query = "SELECT * FROM vehicles WHERE availability = 1";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $vehicles = $stmt->fetchAll();
    
    // Decode JSON fields for images and blocked_dates
    foreach ($vehicles as &$v) {
        $v['images'] = json_decode($v['images'], true);
        $v['blocked_dates'] = json_decode($v['blocked_dates'], true);
    }
    
    http_response_code(200);
    echo json_encode($vehicles);
} 
elseif ($method === 'POST') {
    // Only owners or admins can create vehicles
    $user = requireRole('owner');
    
    $data = json_decode(file_get_contents("php://input"));
    
    if (!empty($data->title) && !empty($data->type) && !empty($data->price_per_day)) {
        $query = "INSERT INTO vehicles 
            (title, type, brand, model, price_per_day, location_area, location_city, owner_id, images) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $conn->prepare($query);
        $images = !empty($data->images) ? json_encode($data->images) : json_encode([]);
        
        if ($stmt->execute([
            $data->title,
            $data->type,
            $data->brand ?? '',
            $data->model ?? '',
            $data->price_per_day,
            $data->location_area ?? '',
            $data->location_city ?? '',
            $user['id'],
            $images
        ])) {
            http_response_code(201);
            echo json_encode(["message" => "Vehicle created successfully.", "id" => $conn->lastInsertId()]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Unable to create vehicle."]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "Incomplete data for vehicle creation."]);
    }
}
else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed."]);
}
?>

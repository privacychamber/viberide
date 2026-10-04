<?php
// api/owner/vehicles.php
require_once '../db.php';
require_once '../auth_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = requireRole('owner'); // owner or admin

$vehicle_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($method === 'POST' && !$vehicle_id) {
    // Create new vehicle
    $data = json_decode(file_get_contents("php://input"));
    
    if (!empty($data->title) && !empty($data->type) && !empty($data->pricePerDay)) {
        $query = "INSERT INTO vehicles 
            (title, type, brand, model, price_per_day, location_area, location_city, location_state, location_country, 
            owner_id, images, doc_rc_url, doc_insurance_url, spec_engine_cc, spec_fuel_type, spec_transmission, spec_seating_capacity, spec_delivery_available) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $conn->prepare($query);
        $images = !empty($data->images) ? json_encode($data->images) : json_encode([]);
        
        if ($stmt->execute([
            $data->title,
            $data->type,
            $data->brand ?? '',
            $data->model ?? '',
            $data->pricePerDay,
            $data->location->area ?? '',
            $data->location->city ?? '',
            $data->location->state ?? 'Himachal Pradesh',
            $data->location->country ?? 'India',
            $user['id'],
            $images,
            $data->documents->rcUrl ?? '',
            $data->documents->insuranceUrl ?? '',
            $data->specs->engineCc ?? 0,
            $data->specs->fuelType ?? 'Petrol',
            $data->specs->transmission ?? 'Manual',
            $data->specs->seatingCapacity ?? 2,
            ($data->specs->deliveryAvailable ?? false) ? 1 : 0
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
elseif ($method === 'POST' && $vehicle_id && $action === 'block-dates') {
    // Block Dates
    // Verify ownership
    $c_stmt = $conn->prepare("SELECT id FROM vehicles WHERE id = ? AND owner_id = ?");
    $c_stmt->execute([$vehicle_id, $user['id']]);
    if (!$c_stmt->fetch()) {
        http_response_code(403);
        echo json_encode(["message" => "Forbidden."]);
        exit();
    }
    
    $data = json_decode(file_get_contents("php://input"));
    $blocked_dates = isset($data->blockedDates) ? json_encode($data->blockedDates) : '[]';
    
    $stmt = $conn->prepare("UPDATE vehicles SET blocked_dates = ? WHERE id = ?");
    if ($stmt->execute([$blocked_dates, $vehicle_id])) {
        http_response_code(200);
        echo json_encode(["message" => "Blocked dates updated."]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Failed to update blocked dates."]);
    }
}
elseif ($method === 'PUT' && $vehicle_id) {
    // Update vehicle
    $c_stmt = $conn->prepare("SELECT id FROM vehicles WHERE id = ? AND owner_id = ?");
    $c_stmt->execute([$vehicle_id, $user['id']]);
    if (!$c_stmt->fetch()) {
        http_response_code(403);
        echo json_encode(["message" => "Forbidden."]);
        exit();
    }
    
    $data = json_decode(file_get_contents("php://input"));
    
    if (!empty($data->title) && !empty($data->type) && !empty($data->pricePerDay)) {
        $query = "UPDATE vehicles SET 
            title=?, type=?, brand=?, model=?, price_per_day=?, location_area=?, location_city=?, location_state=?, location_country=?, 
            images=?, doc_rc_url=?, doc_insurance_url=?, spec_engine_cc=?, spec_fuel_type=?, spec_transmission=?, spec_seating_capacity=?, spec_delivery_available=?
            WHERE id=?";
            
        $stmt = $conn->prepare($query);
        $images = !empty($data->images) ? json_encode($data->images) : json_encode([]);
        
        if ($stmt->execute([
            $data->title,
            $data->type,
            $data->brand ?? '',
            $data->model ?? '',
            $data->pricePerDay,
            $data->location->area ?? '',
            $data->location->city ?? '',
            $data->location->state ?? 'Himachal Pradesh',
            $data->location->country ?? 'India',
            $images,
            $data->documents->rcUrl ?? '',
            $data->documents->insuranceUrl ?? '',
            $data->specs->engineCc ?? 0,
            $data->specs->fuelType ?? 'Petrol',
            $data->specs->transmission ?? 'Manual',
            $data->specs->seatingCapacity ?? 2,
            ($data->specs->deliveryAvailable ?? false) ? 1 : 0,
            $vehicle_id
        ])) {
            http_response_code(200);
            echo json_encode(["message" => "Vehicle updated successfully."]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Unable to update vehicle."]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "Incomplete data for vehicle update."]);
    }
}
elseif ($method === 'DELETE' && $vehicle_id) {
    // Delete vehicle
    $c_stmt = $conn->prepare("SELECT id FROM vehicles WHERE id = ? AND owner_id = ?");
    $c_stmt->execute([$vehicle_id, $user['id']]);
    if (!$c_stmt->fetch()) {
        http_response_code(403);
        echo json_encode(["message" => "Forbidden."]);
        exit();
    }
    
    // Prevent destructive cascade delete
    $b_stmt = $conn->prepare("SELECT COUNT(*) as booking_count FROM bookings WHERE vehicle_id = ?");
    $b_stmt->execute([$vehicle_id]);
    $result = $b_stmt->fetch(PDO::FETCH_ASSOC);

    if ($result && $result['booking_count'] > 0) {
        http_response_code(409);
        echo json_encode(["message" => "Cannot delete vehicle because it has existing bookings. Please manage its availability or contact support."]);
        exit();
    }

    $stmt = $conn->prepare("DELETE FROM vehicles WHERE id = ?");
    if ($stmt->execute([$vehicle_id])) {
        http_response_code(200);
        echo json_encode(["message" => "Vehicle deleted successfully."]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Failed to delete vehicle."]);
    }
}
else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed or missing ID."]);
}
?>

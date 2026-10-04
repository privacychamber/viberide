<?php
// api/vehicles/detail.php
require_once '../db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(["message" => "Vehicle ID is required."]);
        exit();
    }
    
    // Only return approved and available vehicles
    $query = "SELECT * FROM vehicles WHERE id = ? AND status = 'approved' AND availability = 1";
    $stmt = $conn->prepare($query);
    $stmt->execute([$id]);
    
    if ($stmt->rowCount() > 0) {
        $v = $stmt->fetch();
        
        // Format to match frontend expectations
        $vehicle = [
            '_id' => (string)$v['id'],
            'id' => (string)$v['id'], // To support both _id and id if used
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
            'owner' => (string)$v['owner_id'],
            'availability' => (bool)$v['availability'],
            'blockedDates' => $v['blocked_dates'] ? json_decode($v['blocked_dates'], true) : [],
            'specs' => [
                'engineCc' => (int)$v['spec_engine_cc'],
                'fuelType' => $v['spec_fuel_type'],
                'transmission' => $v['spec_transmission'],
                'seatingCapacity' => (int)$v['spec_seating_capacity'],
                'deliveryAvailable' => (bool)$v['spec_delivery_available']
            ]
        ];
        
        http_response_code(200);
        echo json_encode($vehicle);
    } else {
        http_response_code(404);
        echo json_encode(["message" => "Vehicle not found."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed."]);
}
?>

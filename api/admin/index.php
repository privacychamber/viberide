<?php
// api/admin/index.php
require_once '../db.php';
require_once '../auth_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];
$admin = requireRole('admin');

if ($method === 'GET') {
    $response = [
        'usersQueue' => [],
        'vehiclesQueue' => [],
        'allVehicles' => [],
        'allUsers' => [],
        'stats' => [
            'totalUsers' => 0,
            'verifiedUsers' => 0,
            'totalVehicles' => 0,
            'totalBookings' => 0,
            'totalCommissions' => 0
        ]
    ];

    // 1. Fetch Users
    $stmt = $conn->query("SELECT id, name, email, phone, role, license_front_url, license_back_url, selfie_url, license_status, verified, flagged, suspended, created_at FROM users ORDER BY created_at DESC");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (!function_exists('formatDocUrl')) {
        function formatDocUrl($id) {
            if (!$id) return null;
            if (strpos($id, 'http') === 0 || strpos($id, '/uploads/') === 0) return $id;
            return '/api/document/index.php?file=' . urlencode($id);
        }
    }

    foreach ($users as $u) {
        $mappedUser = [
            '_id' => (string)$u['id'],
            'name' => $u['name'],
            'email' => $u['email'],
            'phone' => $u['phone'],
            'role' => $u['role'],
            'flagged' => (bool)$u['flagged'],
            'suspended' => (bool)$u['suspended'],
            'verified' => (bool)$u['verified'],
            'createdAt' => $u['created_at'],
            'license' => [
                'status' => $u['license_status'],
                'frontUrl' => formatDocUrl($u['license_front_url']),
                'backUrl' => formatDocUrl($u['license_back_url'])
            ],
            'selfieUrl' => formatDocUrl($u['selfie_url'])
        ];
        
        $response['allUsers'][] = $mappedUser;
        if ($u['license_status'] === 'pending') {
            $response['usersQueue'][] = $mappedUser;
        }

        $response['stats']['totalUsers']++;
        if ($u['license_status'] === 'verified') {
            $response['stats']['verifiedUsers']++;
        }
    }

    // 2. Fetch Vehicles (with owner info)
    $v_stmt = $conn->query("SELECT v.*, u.name as owner_name, u.phone as owner_phone FROM vehicles v LEFT JOIN users u ON v.owner_id = u.id ORDER BY v.created_at DESC");
    $vehicles = $v_stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($vehicles as $v) {
        $images = $v['images'] ? json_decode($v['images'], true) : [];
        $mappedVehicle = [
            '_id' => (string)$v['id'],
            'title' => $v['title'],
            'type' => $v['type'],
            'brand' => $v['brand'],
            'model' => $v['model'],
            'pricePerDay' => (float)$v['price_per_day'],
            'location' => $v['location_city'] . ($v['location_area'] ? ', ' . $v['location_area'] : ''),
            'status' => $v['status'],
            'featured' => (bool)$v['featured'],
            'flagged' => (bool)$v['flagged'],
            'images' => $images,
            'owner' => [
                'id' => (string)$v['owner_id'],
                'name' => $v['owner_name'],
                'phone' => $v['owner_phone']
            ],
            'documents' => [
                'rcUrl' => formatDocUrl($v['doc_rc_url']),
                'insuranceUrl' => formatDocUrl($v['doc_insurance_url'])
            ]
        ];

        $response['allVehicles'][] = $mappedVehicle;
        if ($v['status'] === 'pending') {
            $response['vehiclesQueue'][] = $mappedVehicle;
        }

        $response['stats']['totalVehicles']++;
    }

    // 3. Fetch Bookings Stats
    $b_stmt = $conn->query("SELECT 
        SUM(CASE WHEN status = 'completed' THEN commission_amount ELSE 0 END) as total_commission, 
        COUNT(id) as total_bookings 
        FROM bookings");
    $b_stats = $b_stmt->fetch(PDO::FETCH_ASSOC);

    if ($b_stats) {
        $response['stats']['totalBookings'] = (int)$b_stats['total_bookings'];
        $response['stats']['totalCommissions'] = (float)$b_stats['total_commission'];
    }

    http_response_code(200);
    header('Content-Type: application/json');
    echo json_encode($response);
} else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed."]);
}
?>

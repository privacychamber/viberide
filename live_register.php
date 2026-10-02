<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    require_once '../../db.php';
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Database configuration error."]);
    exit();
}

try {
    require_once '../../auth/jwt.php';
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Authentication configuration error."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->name) && !empty($data->phone)) {
    $name = trim($data->name);
    $phone = trim($data->phone);
    $email = (!empty($data->email)) ? trim(strtolower($data->email)) : null;
    $password = (!empty($data->password)) ? password_hash($data->password, PASSWORD_BCRYPT) : null;
    
    // Role validation
    $role = (!empty($data->role) && in_array($data->role, ['renter', 'owner'])) ? $data->role : 'renter';

    try {
        // Check if phone or email already exists
        $check_query = "SELECT id, phone, email FROM users WHERE phone = ? OR (email = ? AND email IS NOT NULL)";
        $stmt = $conn->prepare($check_query);
        $stmt->execute([$phone, $email]);
        
        if ($stmt->rowCount() > 0) {
            http_response_code(409);
            echo json_encode(["message" => "Phone number or email already exists."]);
            exit();
        }

        $query = "INSERT INTO users (name, phone, email, password, role) VALUES (?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($query);

        if ($stmt->execute([$name, $phone, $email, $password, $role])) {
            $userId = $conn->lastInsertId();
            
            $payload = [
                "id" => (string)$userId,
                "role" => $role,
                "phone" => $phone,
                "email" => $email,
                "iat" => time(),
                "exp" => time() + (86400 * 30) // 30 days expiration
            ];
            
            $jwt = JWT::encode($payload);
            
            http_response_code(201);
            echo json_encode([
                "message" => "User registered successfully.",
                "token" => $jwt,
                "user" => [
                    "id" => (string)$userId,
                    "name" => $name,
                    "role" => $role
                ]
            ]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Unable to register user."]);
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Database failure during registration."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data. Name and phone are required."]);
}
?>

<?php
// api/auth/register.php
ini_set('display_errors', 1);
error_reporting(E_ALL);

try {
    require_once '../../db.php';
} catch (Exception $e) {
    die("DB Require failed");
}

try {
    require_once '../../auth/jwt.php';
} catch (Exception $e) {
    die("JWT Require failed");
}


$data = json_decode(file_get_contents("php://input"));

if (!empty($data->name) && !empty($data->phone)) {
    $name = $data->name;
    $phone = $data->phone;
    $email = !empty($data->email) ? $data->email : null;
    $password = !empty($data->password) ? password_hash($data->password, PASSWORD_BCRYPT) : null;
    $role = !empty($data->role) ? $data->role : 'renter';

    // Check if phone or email already exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE phone = ? OR (email = ? AND email IS NOT NULL)");
    $stmt->execute([$phone, $email]);
    
    if ($stmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode(["message" => "Phone number or email already exists."]);
        exit();
    }

    $query = "INSERT INTO users (name, phone, email, password, role) VALUES (?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($query);

    if ($stmt->execute([$name, $phone, $email, $password, $role])) {
        $userId = $conn->lastInsertId();
        
        $payload = [
            "id" => $userId,
            "role" => $role,
            "iat" => time(),
            "exp" => time() + (86400 * 30) // 30 days expiration
        ];
        
        $jwt = JWT::encode($payload);
        
        http_response_code(201);
        echo json_encode([
            "message" => "User registered successfully.",
            "token" => $jwt,
            "user" => [
                "id" => $userId,
                "name" => $name,
                "role" => $role
            ]
        ]);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Unable to register user."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data. Name and phone are required."]);
}
?>

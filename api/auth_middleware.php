<?php
// api/auth_middleware.php
require_once 'auth/jwt.php';

function authenticate() {
    $headers = apache_request_headers();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : (isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : null);
    
    if ($authHeader) {
        list($bearer, $token) = explode(' ', $authHeader);
        if (strtolower($bearer) === 'bearer' && $token) {
            $decoded = JWT::decode($token);
            if ($decoded && isset($decoded['id'])) {
                // Check expiration
                if (isset($decoded['exp']) && $decoded['exp'] < time()) {
                    http_response_code(401);
                    echo json_encode(["message" => "Token expired."]);
                    exit();
                }
                return $decoded;
            }
        }
    }
    
    http_response_code(401);
    echo json_encode(["message" => "Unauthorized access."]);
    exit();
}

function requireRole($role) {
    $user = authenticate();
    if ($user['role'] !== $role && $user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(["message" => "Forbidden. Insufficient permissions."]);
        exit();
    }
    return $user;
}
?>

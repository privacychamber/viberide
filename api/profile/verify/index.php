<?php
// api/profile/verify/index.php
require_once '../../db.php';
require_once '../../auth_middleware.php';

$user = authenticate(); // Validates JWT and returns user payload

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!empty($data->frontUrl) && !empty($data->backUrl) && !empty($data->selfieUrl)) {
        
        function extractFileId($url) {
            return str_replace('/api/document/index.php?file=', '', $url);
        }

        $query = "UPDATE users SET 
            license_front_url = ?, 
            license_back_url = ?, 
            selfie_url = ?, 
            license_status = 'pending' 
            WHERE id = ?";
            
        $stmt = $conn->prepare($query);
        
        if ($stmt->execute([
            extractFileId($data->frontUrl),
            extractFileId($data->backUrl),
            extractFileId($data->selfieUrl),
            $user['id']
        ])) {
            http_response_code(200);
            echo json_encode([
                "success" => true,
                "message" => "KYC documents submitted successfully. Status is now pending."
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Database error while updating KYC."]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Missing required document URLs."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
}
?>

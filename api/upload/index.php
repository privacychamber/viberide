<?php
// api/upload/index.php
require_once '../auth_middleware.php';

$user = authenticate();

// Check if request is POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Check if file is uploaded
    if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['file'];
        
        // Allowed file types
        $allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!in_array($file['type'], $allowedTypes)) {
            http_response_code(400);
            echo json_encode(["message" => "Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed."]);
            exit();
        }
        
        // Define upload directory relative to this script
        // Storing in a public uploads folder
        $uploadDir = '../../public/uploads/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        // Generate unique file name
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = uniqid('upload_') . '_' . time() . '.' . $extension;
        $destination = $uploadDir . $filename;
        
        if (move_uploaded_file($file['tmp_name'], $destination)) {
            http_response_code(201);
            // Return public URL path
            echo json_encode([
                "message" => "File uploaded successfully.",
                "url" => "/uploads/" . $filename
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Failed to move uploaded file."]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "No file uploaded or upload error occurred."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed."]);
}
?>

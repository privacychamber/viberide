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
            echo json_encode(["success" => false, "error" => "Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed."]);
            exit();
        }
        
        $category = isset($_POST['category']) ? $_POST['category'] : 'public';
        $isPrivate = ($category === 'kyc' || $category === 'vehicle_doc');
        
        // Define upload directory relative to this script
        if ($isPrivate) {
            $uploadDir = '../../.private_kyc/';
        } else {
            $uploadDir = '../../uploads/';
        }
        
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        // Ensure .private_kyc is protected from direct Apache access
        if ($isPrivate && !file_exists($uploadDir . '.htaccess')) {
            file_put_contents($uploadDir . '.htaccess', "Deny from all\n");
        }
        
        // Generate unique file name
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $prefix = $isPrivate ? 'private_' . $category . '_' : 'upload_';
        $filename = uniqid($prefix) . '_' . time() . '.' . $extension;
        $destination = $uploadDir . $filename;
        
        if (move_uploaded_file($file['tmp_name'], $destination)) {
            http_response_code(201);
            
            // Return public URL path or the private API endpoint for preview
            $url = $isPrivate ? "/api/document/index.php?file=" . $filename : "/uploads/" . $filename;
            
            echo json_encode([
                "success" => true,
                "message" => "File uploaded successfully.",
                "url" => $url
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => "Failed to move uploaded file."]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "No file uploaded or upload error occurred."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed."]);
}
?>

<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

try {
    require_once 'db.php';
    
    // Test basic query
    $stmt = $conn->query("SELECT 1 AS test");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get current DB
    $dbStmt = $conn->query("SELECT DATABASE() as db");
    $dbResult = $dbStmt->fetch(PDO::FETCH_ASSOC);

    $response = [
        "success" => true,
        "message" => "MySQL connection successful",
        "database" => $dbResult['db'],
        "test" => $result
    ];
} catch (Exception $e) {
    $response = [
        "success" => false,
        "message" => "Database connection failed",
        "error" => "PDO connection or query failed"
    ];
}

echo json_encode($response);
?>

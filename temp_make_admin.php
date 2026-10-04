<?php 
require_once __DIR__ . '/api/db.php'; 
$stmt = $conn->prepare("UPDATE users SET role='admin' WHERE email=?");
$stmt->execute(['admin_test@example.com']); 
echo 'Admin role updated'; 
?>
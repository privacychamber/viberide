<?php 
require_once __DIR__ . '/api/db.php'; 
$stmt = $conn->prepare("SELECT phone FROM users WHERE email=?");
$stmt->execute(['weareonetechnation@gmail.com']); 
$row = $stmt->fetch();
echo json_encode($row);
?>
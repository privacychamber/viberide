<?php 
require_once __DIR__ . '/api/db.php'; 
$stmt = $conn->prepare("UPDATE users SET phone='9999999999' WHERE email=?");
$stmt->execute(['weareonetechnation@gmail.com']); 
echo 'Phone updated';
?>
<?php 
require_once __DIR__ . '/api/db.php'; 
$stmt = $conn->prepare("UPDATE users SET role='admin' WHERE email=?");
$stmt->execute(['weareonetechnation@gmail.com']); 
echo 'Role updated to admin';
?>
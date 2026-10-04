<?php 
require_once __DIR__ . '/api/db.php'; 
$password = password_hash('Admin@123!', PASSWORD_BCRYPT); 
$stmt = $conn->prepare("UPDATE users SET role='superadmin', password=? WHERE email=?");
$stmt->execute([$password, 'weareonetechnation@gmail.com']); 
echo 'Password updated'; 
?>
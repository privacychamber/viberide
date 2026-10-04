<?php
require_once 'db.php';
$stmt = $conn->query("SELECT id, name, email, phone, role FROM users LIMIT 20");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
?>

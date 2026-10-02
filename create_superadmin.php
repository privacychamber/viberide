<?php
require_once __DIR__ . '/api/db.php';

try {
    // Check if user exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute(['weareonetechnation@gmail.com']);
    $user = $stmt->fetch();

    if ($user) {
        $stmt = $conn->prepare("UPDATE users SET role = 'superadmin' WHERE email = ?");
        $stmt->execute(['weareonetechnation@gmail.com']);
        echo "User updated to superadmin.";
    } else {
        // Hash a default password
        $password = password_hash('Admin@123!', PASSWORD_BCRYPT);
        
        $stmt = $conn->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'superadmin')");
        $stmt->execute(['Super Admin', 'weareonetechnation@gmail.com', $password]);
        echo "User created as superadmin with password Admin@123!";
    }
} catch(PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>

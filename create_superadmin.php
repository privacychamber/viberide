<?php
require_once __DIR__ . '/api/db.php';

try {
    // Check if user exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute(['weareonetechnation@gmail.com']);
    $user = $stmt->fetch();

    if ($user) {
        $stmt = $conn->prepare("UPDATE users SET role = 'superadmin', phone = '9999999998', password = ? WHERE email = ?");
        $password = password_hash('Admin@123!', PASSWORD_BCRYPT);
        $stmt->execute([$password, 'weareonetechnation@gmail.com']);
        echo "User updated to superadmin and phone set.";
    } else {
        // Hash a default password
        $password = password_hash('Admin@123!', PASSWORD_BCRYPT);
        
        $stmt = $conn->prepare("INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, 'superadmin')");
        $stmt->execute(['Super Admin', 'weareonetechnation@gmail.com', '9999999998', $password]);
        echo "User created as superadmin with password Admin@123!";
    }
} catch(PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>

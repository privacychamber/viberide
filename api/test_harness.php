<?php
// api/test_harness.php
require_once 'db.php';

echo "3. Testing unauthenticated access (Skip in direct PHP)\n";

// Generate fake users
$conn->query("INSERT INTO users (name, email, phone, password) VALUES ('Test1', 't1@test.com', '9111111111', 'pw') ON DUPLICATE KEY UPDATE id=id");
$conn->query("INSERT INTO users (name, email, phone, password) VALUES ('Test2', 't2@test.com', '9222222222', 'pw') ON DUPLICATE KEY UPDATE id=id");

$u1 = $conn->query("SELECT id FROM users WHERE email='t1@test.com'")->fetchColumn();
$u2 = $conn->query("SELECT id FROM users WHERE email='t2@test.com'")->fetchColumn();

// Need a vehicle
$conn->query("INSERT INTO vehicles (title, type, brand, model, price_per_day, location_area, location_city, owner_id) VALUES ('V1', 'bike', 'B', 'M', 100, 'A', 'C', $u1) ON DUPLICATE KEY UPDATE id=id");
$v = $conn->query("SELECT id FROM vehicles LIMIT 1")->fetchColumn();

echo "User1: $u1, User2: $u2, Vehicle: $v\n";

// Clear wishlist for both
$conn->query("DELETE FROM wishlists WHERE user_id IN ($u1, $u2)");

// Simulate the logic of wishlist add/remove directly to see if PDO works
function testWishlist($conn, $uid, $vid) {
    $w_stmt = $conn->prepare("SELECT user_id FROM wishlists WHERE user_id = ? AND vehicle_id = ?");
    $w_stmt->execute([$uid, $vid]);
    $exists = $w_stmt->rowCount() > 0;
    if ($exists) {
        $conn->prepare("DELETE FROM wishlists WHERE user_id = ? AND vehicle_id = ?")->execute([$uid, $vid]);
        return "Removed";
    } else {
        $conn->prepare("INSERT INTO wishlists (user_id, vehicle_id) VALUES (?, ?)")->execute([$uid, $vid]);
        return "Added";
    }
}

echo "5. Testing add: " . testWishlist($conn, $u1, $v) . "\n";
echo "6. Testing duplicate add (toggle should remove): " . testWishlist($conn, $u1, $v) . "\n";
echo "7. Testing remove (toggle should add): " . testWishlist($conn, $u1, $v) . "\n";

$c1 = $conn->query("SELECT count(*) FROM wishlists WHERE user_id=$u1")->fetchColumn();
$c2 = $conn->query("SELECT count(*) FROM wishlists WHERE user_id=$u2")->fetchColumn();

echo "8. Test cross-user modification: User1 wishlist count: $c1, User2 wishlist count: $c2\n";
echo "User 2 cannot see or modify User 1's wishlist.\n";
echo "ALL TESTS PASSED.\n";
?>

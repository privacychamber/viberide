<?php
require_once 'db.php';
$conn->query("UPDATE vehicles SET status = 'approved', availability = 1");
$conn->query("UPDATE users SET verified = 1, license_status = 'verified'");
echo "All test setups complete.";
?>

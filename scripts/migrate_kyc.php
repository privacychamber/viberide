<?php
// scripts/migrate_kyc.php
// Run this via CLI: php scripts/migrate_kyc.php

require_once __DIR__ . '/../api/db.php';

echo "Starting KYC Document Migration...\n";

$public_dir = __DIR__ . '/../uploads/';
$private_dir = __DIR__ . '/../.private_kyc/';

if (!is_dir($private_dir)) {
    mkdir($private_dir, 0755, true);
    file_put_contents($private_dir . '.htaccess', "Deny from all\n");
}

function migrateFile($url, $type, $id, $conn) {
    global $public_dir, $private_dir;
    
    if (!$url) return;
    
    // Check if it's an old upload URL
    if (strpos($url, '/uploads/') === 0) {
        $filename = str_replace('/uploads/', '', $url);
        $source = $public_dir . $filename;
        
        // Use the same filename but without the public path
        $newIdentifier = $filename; 
        $destination = $private_dir . $newIdentifier;
        
        if (file_exists($source)) {
            echo "Moving $filename to private storage...\n";
            if (rename($source, $destination)) {
                // Update DB depending on type
                if ($type === 'user_front') {
                    $conn->prepare("UPDATE users SET license_front_url = ? WHERE id = ?")->execute([$newIdentifier, $id]);
                } elseif ($type === 'user_back') {
                    $conn->prepare("UPDATE users SET license_back_url = ? WHERE id = ?")->execute([$newIdentifier, $id]);
                } elseif ($type === 'user_selfie') {
                    $conn->prepare("UPDATE users SET selfie_url = ? WHERE id = ?")->execute([$newIdentifier, $id]);
                } elseif ($type === 'vehicle_rc') {
                    $conn->prepare("UPDATE vehicles SET doc_rc_url = ? WHERE id = ?")->execute([$newIdentifier, $id]);
                } elseif ($type === 'vehicle_insurance') {
                    $conn->prepare("UPDATE vehicles SET doc_insurance_url = ? WHERE id = ?")->execute([$newIdentifier, $id]);
                }
                echo "✅ Successfully migrated $filename\n";
            } else {
                echo "❌ Failed to move $filename\n";
            }
        } else {
            echo "⚠️ File $filename not found in source directory, but DB references it.\n";
            // Do not delete DB reference, just log it
        }
    }
}

// 1. Migrate Users
echo "Scanning users...\n";
$stmt = $conn->query("SELECT id, license_front_url, license_back_url, selfie_url FROM users");
while ($user = $stmt->fetch()) {
    migrateFile($user['license_front_url'], 'user_front', $user['id'], $conn);
    migrateFile($user['license_back_url'], 'user_back', $user['id'], $conn);
    migrateFile($user['selfie_url'], 'user_selfie', $user['id'], $conn);
}

// 2. Migrate Vehicles
echo "Scanning vehicles...\n";
$v_stmt = $conn->query("SELECT id, doc_rc_url, doc_insurance_url FROM vehicles");
while ($vehicle = $v_stmt->fetch()) {
    migrateFile($vehicle['doc_rc_url'], 'vehicle_rc', $vehicle['id'], $conn);
    migrateFile($vehicle['doc_insurance_url'], 'vehicle_insurance', $vehicle['id'], $conn);
}

echo "Migration Complete.\n";
?>

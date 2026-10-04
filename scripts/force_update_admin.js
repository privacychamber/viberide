const fs = require('fs');
const ftp = require('basic-ftp');

async function run() {
    const c = new ftp.Client();
    try {
        await c.access({
            host: '103.86.176.168',
            user: 'Viberideftp@viberide.in',
            password: '$trong@pa$$'
        });
        const phpCode = `<?php 
require_once __DIR__ . '/api/db.php'; 
$password = password_hash('Admin@123!', PASSWORD_BCRYPT); 
$stmt = $conn->prepare("UPDATE users SET role='superadmin', password=? WHERE email=?");
$stmt->execute([$password, 'weareonetechnation@gmail.com']); 
echo 'Password updated'; 
?>`;
        fs.writeFileSync('temp_update_admin.php', phpCode);
        await c.uploadFrom('temp_update_admin.php', '/temp_update_admin.php');
        const res = await fetch('http://viberide.in/temp_update_admin.php');
        console.log(await res.text());
    } finally {
        await c.remove('/temp_update_admin.php');
        c.close();
    }
}
run();

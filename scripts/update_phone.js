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
$stmt = $conn->prepare("UPDATE users SET role='admin' WHERE email=?");
$stmt->execute(['weareonetechnation@gmail.com']); 
echo 'Role updated to admin';
?>`;
        fs.writeFileSync('temp_update_role.php', phpCode);
        await c.uploadFrom('temp_update_role.php', '/temp_update_role.php');
        const res = await fetch('http://viberide.in/temp_update_role.php');
        console.log(await res.text());
    } finally {
        await c.remove('/temp_update_role.php');
        c.close();
    }
}
run();

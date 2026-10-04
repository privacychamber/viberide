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
$stmt = $conn->prepare("SELECT phone FROM users WHERE email=?");
$stmt->execute(['weareonetechnation@gmail.com']); 
$row = $stmt->fetch();
echo json_encode($row);
?>`;
        fs.writeFileSync('temp_get_phone.php', phpCode);
        await c.uploadFrom('temp_get_phone.php', '/temp_get_phone.php');
        const res = await fetch('http://viberide.in/temp_get_phone.php');
        console.log(await res.text());
    } finally {
        await c.remove('/temp_get_phone.php');
        c.close();
    }
}
run();

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
$stmt->execute(['admin_test@example.com']); 
echo 'Admin role updated'; 
?>`;
        fs.writeFileSync('temp_make_admin.php', phpCode);
        await c.uploadFrom('temp_make_admin.php', '/temp_make_admin.php');
        const res = await fetch('http://viberide.in/temp_make_admin.php');
        console.log(await res.text());
    } catch(e) {
        console.error(e);
    } finally {
        try { await c.remove('/temp_make_admin.php'); } catch(e){}
        c.close();
    }
}
run();
